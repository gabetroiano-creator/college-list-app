import { GRADE_ORDER } from '@/lib/grades'
import { gradeClasses } from '@/lib/grades'
import type { GradeLetter } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GradePickerProps {
  value: GradeLetter | null | undefined
  onChange: (g: GradeLetter) => void
  size?: 'sm' | 'md'
}

export function GradePicker({ value, onChange, size = 'md' }: GradePickerProps) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${size === 'sm' ? 7 : 13}, minmax(0,1fr))` }}
    >
      {GRADE_ORDER.map((g) => {
        const active = value === g
        const c = gradeClasses(g)
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={cn(
              'flex items-center justify-center rounded-lg border font-serif font-semibold tabular-nums transition-all duration-150 hover:scale-105 active:scale-95',
              size === 'sm' ? 'h-8 text-xs' : 'h-11 text-sm',
              active ? cn(c.badge, 'ring-2 ring-offset-1 ring-gold-400 dark:ring-offset-navy-800') : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-navy-600 dark:bg-navy-900/30 dark:text-slate-400',
            )}
          >
            {g}
          </button>
        )
      })}
    </div>
  )
}
