import { CRITERIA, CRITERIA_GROUPS, DEFAULT_WEIGHT, groupById } from './criteria'
import { FRAMEWORKS, type FwResult, type FwContext } from './frameworks'
import type { CriterionScores, FrameworkAnswers, School } from './types'

/** Weighted matrix total on a 0–10 scale, considering only scored criteria. */
export function matrixWeightedTotal(
  scores: CriterionScores | undefined,
  weights: Record<string, number>,
): number | null {
  if (!scores) return null
  let weightSum = 0
  let weighted = 0
  let count = 0
  for (const c of CRITERIA) {
    const s = scores[c.id]
    if (typeof s === 'number') {
      const w = weights[c.id] ?? DEFAULT_WEIGHT
      weighted += s * w
      weightSum += w
      count++
    }
  }
  if (count === 0 || weightSum === 0) return null
  return weighted / weightSum
}

/** Weighted subtotal for a single category group, 0–10, or null if unscored. */
export function categorySubtotal(
  groupId: string,
  scores: CriterionScores | undefined,
  weights: Record<string, number>,
): number | null {
  if (!scores) return null
  let weightSum = 0
  let weighted = 0
  let count = 0
  for (const c of CRITERIA.filter((x) => x.groupId === groupId)) {
    const s = scores[c.id]
    if (typeof s === 'number') {
      const w = weights[c.id] ?? DEFAULT_WEIGHT
      weighted += s * w
      weightSum += w
      count++
    }
  }
  if (count === 0 || weightSum === 0) return null
  return weighted / weightSum
}

export interface CategorySignal {
  groupId: string
  label: string
  value: number | null
}

export function allCategorySubtotals(
  scores: CriterionScores | undefined,
  weights: Record<string, number>,
): CategorySignal[] {
  return CRITERIA_GROUPS.map((g) => ({
    groupId: g.id,
    label: g.label,
    value: categorySubtotal(g.id, scores, weights),
  }))
}

/** Fraction of the 30 criteria that have been scored. */
export function matrixCompleteness(scores: CriterionScores | undefined): number {
  if (!scores) return 0
  const n = CRITERIA.filter((c) => typeof scores[c.id] === 'number').length
  return n / CRITERIA.length
}

/** Compute all 8 framework results for one school from raw answers. */
export function computeFrameworkResults(
  answers: FrameworkAnswers | undefined,
  ctx: FwContext,
): Record<number, FwResult> {
  const out: Record<number, FwResult> = {}
  for (const fw of FRAMEWORKS) {
    const a = (answers && answers[fw.key]) || {}
    out[fw.n] = fw.score(a, ctx)
  }
  return out
}

/** Weighted framework total across frameworks that have a score, 0–10. */
export function frameworkWeightedTotal(
  results: Record<number, FwResult>,
  weights: Record<number, number>,
): number | null {
  let weightSum = 0
  let weighted = 0
  let count = 0
  for (const fw of FRAMEWORKS) {
    const r = results[fw.n]
    // Only completed frameworks contribute to the aggregate, so a school with
    // no real framework input reads "—" rather than a misleading partial score.
    if (r && r.complete && r.score !== null) {
      const w = weights[fw.n] ?? 5
      weighted += r.score * w
      weightSum += w
      count++
    }
  }
  if (count === 0 || weightSum === 0) return null
  return weighted / weightSum
}

export function frameworkCompletion(results: Record<number, FwResult>): {
  completed: number
  total: number
} {
  const total = FRAMEWORKS.length
  const completed = FRAMEWORKS.filter((fw) => results[fw.n]?.complete).length
  return { completed, total }
}

/** 50% matrix, 50% frameworks. Falls back to whichever exists. */
export function combinedScore(matrix: number | null, framework: number | null): number | null {
  if (matrix === null && framework === null) return null
  if (matrix === null) return framework
  if (framework === null) return matrix
  return 0.5 * matrix + 0.5 * framework
}

export type RecLabel =
  | 'KEEP'
  | 'KEEP — PENDING VISIT'
  | 'RESEARCH MORE'
  | 'LIKELY CUT'
  | 'CUT'
  | 'NOT ENOUGH DATA'

export type Confidence = 'High' | 'Medium' | 'Low'

export interface Recommendation {
  label: RecLabel
  confidence: Confidence
  summary: string
  combined: number | null
}

const REC_STYLES: Record<RecLabel, { badge: string; hex: string }> = {
  KEEP: { badge: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400', hex: '#2D6A4F' },
  'KEEP — PENDING VISIT': { badge: 'bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400', hex: '#14B8A6' },
  'RESEARCH MORE': { badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400', hex: '#0EA5E9' },
  'LIKELY CUT': { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400', hex: '#F59E0B' },
  CUT: { badge: 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400', hex: '#DC2626' },
  'NOT ENOUGH DATA': { badge: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-navy-700 dark:text-slate-300 dark:border-navy-600', hex: '#94A3B8' },
}

export function recStyle(label: RecLabel) {
  return REC_STYLES[label]
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  const v = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
  return Math.sqrt(v)
}

export interface RecommendationInput {
  school: School
  scores: CriterionScores | undefined
  matrixWeights: Record<string, number>
  results: Record<number, FwResult>
  answers: FrameworkAnswers | undefined
}

export function buildRecommendation(input: RecommendationInput): Recommendation {
  const { school, scores, matrixWeights, results, answers } = input
  const matrix = matrixWeightedTotal(scores, matrixWeights)
  const fwTotal = frameworkWeightedTotal(
    results,
    FRAMEWORKS.reduce((acc, f) => ((acc[f.n] = 5), acc), {} as Record<number, number>),
  )
  const combined = combinedScore(matrix, fwTotal)

  const visitIncomplete = !results[4]?.complete
  const { completed, total } = frameworkCompletion(results)
  const matrixComp = matrixCompleteness(scores)

  let label: RecLabel
  if (combined === null) label = 'NOT ENOUGH DATA'
  else if (combined >= 7) label = visitIncomplete ? 'KEEP — PENDING VISIT' : 'KEEP'
  else if (combined >= 5) label = 'RESEARCH MORE'
  else if (combined >= 3) label = 'LIKELY CUT'
  else label = 'CUT'

  // Confidence
  const fwScores = FRAMEWORKS.map((f) => results[f.n]?.score).filter(
    (s): s is number => typeof s === 'number',
  )
  const dispersion = stddev(fwScores) // 0 (consistent) … ~5 (mixed)
  const completionRatio = (completed / total) * 0.6 + matrixComp * 0.4
  let confidence: Confidence
  if (combined === null || completionRatio < 0.4) confidence = 'Low'
  else if (completionRatio >= 0.75 && dispersion < 2.2) confidence = 'High'
  else confidence = 'Medium'

  // Summary
  const cats = allCategorySubtotals(scores, matrixWeights).filter((c) => c.value !== null) as {
    groupId: string
    label: string
    value: number
  }[]
  const sorted = [...cats].sort((a, b) => b.value - a.value)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  const fw2Ease = answers?.fw2?.q2
  const easePhrase =
    typeof fw2Ease === 'number' ? (fw2Ease > 6 ? 'came easily' : fw2Ease < 4 ? 'was hard to find' : 'came with some effort') : 'has not been written'

  const fw6Regret = answers?.fw6?.q1
  const regretPhrase =
    typeof fw6Regret === 'number'
      ? fw6Regret >= 7
        ? 'you would deeply regret passing this up'
        : fw6Regret <= 3
          ? 'you would feel little regret if you let it go'
          : 'the regret of missing it would be moderate'
      : 'the regret signal is still unmeasured'

  const name = school.name || 'This school'
  let summary: string
  if (combined === null) {
    summary = `${name} doesn't have enough data yet. Score its decision matrix and work through the frameworks to generate a recommendation.`
  } else {
    const strong = strongest ? `${strongest.label} (${strongest.value.toFixed(1)})` : 'no clear strength yet'
    const weak = weakest && weakest.groupId !== strongest?.groupId ? `${weakest.label} (${weakest.value.toFixed(1)})` : 'few apparent weaknesses'
    summary =
      `Based on your responses, ${name} shows strong signals in ${strong} but raises concerns in ${weak}. ` +
      `The anti-portfolio argument ${easePhrase}, and your regret score suggests ${regretPhrase}. ` +
      `${completed} of ${total} frameworks are complete${visitIncomplete ? ', and a campus visit is still outstanding' : ''}. ` +
      `Recommendation: ${label} (${confidence.toLowerCase()} confidence).`
  }

  return { label, confidence, summary, combined }
}
