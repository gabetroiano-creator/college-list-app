import type { GradeLetter } from './types'

export const GRADE_ORDER: GradeLetter[] = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F',
]

export const GRADE_GPA: Record<GradeLetter, number> = {
  'A+': 4.3, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0.0,
}

export type GradeFamily = 'emerald' | 'blue' | 'amber' | 'red' | 'slate'

export function gradeFamily(letter: GradeLetter | null | undefined): GradeFamily {
  if (!letter) return 'slate'
  if (letter.startsWith('A')) return 'emerald'
  if (letter.startsWith('B')) return 'blue'
  if (letter.startsWith('C')) return 'amber'
  return 'red' // D and below, and F
}

export const GRADE_FAMILY_CLASSES: Record<GradeFamily, { badge: string; solid: string; hex: string }> = {
  emerald: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', solid: 'bg-emerald-500', hex: '#10B981' },
  blue: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30', solid: 'bg-blue-500', hex: '#3B82F6' },
  amber: { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', solid: 'bg-amber-500', hex: '#F59E0B' },
  red: { badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30', solid: 'bg-red-500', hex: '#EF4444' },
  slate: { badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-navy-700 dark:text-slate-300 dark:border-navy-600', solid: 'bg-slate-400', hex: '#94A3B8' },
}

export function gradeClasses(letter: GradeLetter | null | undefined) {
  return GRADE_FAMILY_CLASSES[gradeFamily(letter)]
}

export function gpaFor(letter: GradeLetter | null | undefined): number | null {
  if (!letter) return null
  return GRADE_GPA[letter]
}
