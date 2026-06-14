import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TIER_CLASSES, STATUS_CLASSES, ROUND_CLASSES } from '@/lib/schoolMeta'
import type { AppRound, GradeLetter, SchoolStatus, Tier } from '@/lib/types'
import { gradeClasses } from '@/lib/grades'
import { recStyle, type RecLabel } from '@/lib/scoring'

export function TierBadge({ tier, animateIn, className }: { tier: Tier; animateIn?: boolean; className?: string }) {
  const c = TIER_CLASSES[tier]
  return (
    <Badge animateIn={animateIn} className={cn(c.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {tier}
    </Badge>
  )
}

export function StatusBadge({ status, className }: { status: SchoolStatus; className?: string }) {
  return <Badge className={cn(STATUS_CLASSES[status], className)}>{status}</Badge>
}

export function RoundBadge({ round, className }: { round: AppRound; className?: string }) {
  return <Badge className={cn(ROUND_CLASSES[round], 'font-semibold', className)}>{round}</Badge>
}

export function GradeBadge({
  letter,
  className,
  size = 'md',
}: {
  letter: GradeLetter | null | undefined
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const c = gradeClasses(letter)
  const sizes = {
    sm: 'h-6 min-w-[1.5rem] text-xs px-1.5',
    md: 'h-7 min-w-[1.9rem] text-sm px-2',
    lg: 'h-10 min-w-[2.6rem] text-lg px-2.5',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-serif font-semibold tabular-nums',
        c.badge,
        sizes[size],
        className,
      )}
    >
      {letter ?? '—'}
    </span>
  )
}

export function RecBadge({ label, className }: { label: RecLabel; className?: string }) {
  const c = recStyle(label)
  return (
    <Badge className={cn(c.badge, 'font-semibold uppercase tracking-wide', className)}>{label}</Badge>
  )
}
