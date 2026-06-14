import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  allCategorySubtotals,
  buildRecommendation,
  combinedScore,
  computeFrameworkResults,
  frameworkCompletion,
  frameworkWeightedTotal,
  matrixCompleteness,
  matrixWeightedTotal,
  type Recommendation,
} from '@/lib/scoring'
import { gpaFor } from '@/lib/grades'
import type { FwResult } from '@/lib/frameworks'
import type { School } from '@/lib/types'

export interface SchoolMetrics {
  school: School
  matrixTotal: number | null
  matrixComplete: number // 0..1
  categories: ReturnType<typeof allCategorySubtotals>
  frameworkResults: Record<number, FwResult>
  frameworkTotal: number | null
  frameworksCompleted: number
  frameworksTotal: number
  recommendation: Recommendation
  combined: number | null
  gpa: number | null
  /** combined matrix + framework + grade, used for export ranking (0..10) */
  composite: number | null
}

export function useSchoolMetrics(schoolId: string | null | undefined): SchoolMetrics | null {
  const school = useStore((s) => s.schools.find((x) => x.id === schoolId))
  const scores = useStore((s) => (schoolId ? s.matrixScores[schoolId] : undefined))
  const weights = useStore((s) => s.matrixWeights)
  const fwWeights = useStore((s) => s.frameworkWeights)
  const answers = useStore((s) => (schoolId ? s.frameworkAnswers[schoolId] : undefined))
  const grade = useStore((s) => (schoolId ? s.grades[schoolId] : undefined))

  return useMemo(() => {
    if (!school) return null
    const matrixTotal = matrixWeightedTotal(scores, weights)
    const categories = allCategorySubtotals(scores, weights)
    const frameworkResults = computeFrameworkResults(answers, {
      oneStrongReason: school.oneStrongReason,
      visitStatus: school.visitStatus,
    })
    const frameworkTotal = frameworkWeightedTotal(frameworkResults, fwWeights)
    const { completed, total } = frameworkCompletion(frameworkResults)
    const recommendation = buildRecommendation({
      school,
      scores,
      matrixWeights: weights,
      results: frameworkResults,
      answers,
    })
    const combined = combinedScore(matrixTotal, frameworkTotal)
    const gpa = gpaFor(grade?.letter)
    const gradeScore = gpa !== null ? (gpa / 4.3) * 10 : null
    const composite = compositeOf(matrixTotal, frameworkTotal, gradeScore)
    return {
      school,
      matrixTotal,
      matrixComplete: matrixCompleteness(scores),
      categories,
      frameworkResults,
      frameworkTotal,
      frameworksCompleted: completed,
      frameworksTotal: total,
      recommendation,
      combined,
      gpa,
      composite,
    }
  }, [school, scores, weights, fwWeights, answers, grade])
}

function compositeOf(matrix: number | null, framework: number | null, grade: number | null): number | null {
  const parts: { v: number; w: number }[] = []
  if (matrix !== null) parts.push({ v: matrix, w: 0.4 })
  if (framework !== null) parts.push({ v: framework, w: 0.4 })
  if (grade !== null) parts.push({ v: grade, w: 0.2 })
  if (parts.length === 0) return null
  const wsum = parts.reduce((a, p) => a + p.w, 0)
  return parts.reduce((a, p) => a + p.v * p.w, 0) / wsum
}

/** Metrics for every school, recomputed when any relevant slice changes. */
export function useAllMetrics(): SchoolMetrics[] {
  const schools = useStore((s) => s.schools)
  const matrixScores = useStore((s) => s.matrixScores)
  const weights = useStore((s) => s.matrixWeights)
  const fwWeights = useStore((s) => s.frameworkWeights)
  const frameworkAnswers = useStore((s) => s.frameworkAnswers)
  const grades = useStore((s) => s.grades)

  return useMemo(() => {
    return schools.map((school) => {
      const scores = matrixScores[school.id]
      const answers = frameworkAnswers[school.id]
      const matrixTotal = matrixWeightedTotal(scores, weights)
      const categories = allCategorySubtotals(scores, weights)
      const frameworkResults = computeFrameworkResults(answers, {
        oneStrongReason: school.oneStrongReason,
        visitStatus: school.visitStatus,
      })
      const frameworkTotal = frameworkWeightedTotal(frameworkResults, fwWeights)
      const { completed, total } = frameworkCompletion(frameworkResults)
      const recommendation = buildRecommendation({
        school,
        scores,
        matrixWeights: weights,
        results: frameworkResults,
        answers,
      })
      const combined = combinedScore(matrixTotal, frameworkTotal)
      const gpa = gpaFor(grades[school.id]?.letter)
      const gradeScore = gpa !== null ? (gpa / 4.3) * 10 : null
      return {
        school,
        matrixTotal,
        matrixComplete: matrixCompleteness(scores),
        categories,
        frameworkResults,
        frameworkTotal,
        frameworksCompleted: completed,
        frameworksTotal: total,
        recommendation,
        combined,
        gpa,
        composite: compositeOf(matrixTotal, frameworkTotal, gradeScore),
      }
    })
  }, [schools, matrixScores, weights, fwWeights, frameworkAnswers, grades])
}
