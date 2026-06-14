import type { AppRound, SchoolStatus, Tier, VisitStatus } from './types'

export const TIERS: Tier[] = ['Unlikely', 'Reach', 'Target', 'Likely']
export const STATUSES: SchoolStatus[] = ['Applying', 'Chopping Block', 'Not Applying', 'Removed']
export const VISITS: VisitStatus[] = ['Not Visited', 'Planned', 'Visited']
export const ROUNDS: AppRound[] = ['ED1', 'ED2', 'EA', 'REA', 'RD']

export const TIER_CLASSES: Record<Tier, { badge: string; dot: string; hex: string }> = {
  Unlikely: { badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30', dot: 'bg-red-500', hex: '#DC2626' },
  Reach: { badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30', dot: 'bg-orange-500', hex: '#EA580C' },
  Target: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30', dot: 'bg-blue-500', hex: '#2563EB' },
  Likely: { badge: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30', dot: 'bg-green-500', hex: '#16A34A' },
}

export const STATUS_CLASSES: Record<SchoolStatus, string> = {
  Applying: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  'Chopping Block': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  'Not Applying': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-navy-700 dark:text-slate-300 dark:border-navy-600',
  Removed: 'bg-red-50 text-red-600 border-red-200 line-through dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
}

export const ROUND_CLASSES: Record<AppRound, string> = {
  ED1: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30',
  ED2: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
  EA: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  REA: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
  RD: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-navy-700 dark:text-slate-300 dark:border-navy-600',
}

export const ROUND_LABEL: Record<AppRound, string> = {
  ED1: 'Early Decision I',
  ED2: 'Early Decision II',
  EA: 'Early Action',
  REA: 'Restrictive Early Action',
  RD: 'Regular Decision',
}

/** Admit-rate color: green >30, amber 15–30, red <15. */
export function admitRateClass(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'text-slate-400'
  if (rate > 30) return 'text-green-600 dark:text-green-400'
  if (rate >= 15) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500'
}

/** Color for a 0–10 matrix score. */
export function scoreClass(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-slate-400'
  if (score >= 7.5) return 'text-green-600 dark:text-green-400'
  if (score >= 5) return 'text-blue-600 dark:text-blue-400'
  if (score >= 3) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500'
}

export function scoreBarColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#CBD5E1'
  if (score >= 7.5) return '#16A34A'
  if (score >= 5) return '#2563EB'
  if (score >= 3) return '#F59E0B'
  return '#DC2626'
}
