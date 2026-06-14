import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { fmtScore } from '@/lib/utils'
import { scoreClass } from '@/lib/schoolMeta'

export function ScorePill({ score, className }: { score: number | null | undefined; className?: string }) {
  return (
    <span className={cn('font-sans font-semibold tabular-nums', scoreClass(score), className)}>{fmtScore(score)}</span>
  )
}

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-900/30', className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-serif text-lg font-semibold text-navy-800 dark:text-white">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  )
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-navy-800 dark:text-white">{children}</span>
    </div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400', className)}>{children}</div>
  )
}
