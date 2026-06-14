import { cn } from '@/lib/utils'

export interface SegOption<T extends string> {
  value: T
  label: string
  /** Optional active classes (e.g. tier color). */
  activeClass?: string
}

interface SegmentedProps<T extends string> {
  options: SegOption<T>[]
  value: T | null | undefined
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
  /** wrap into a grid instead of a single row */
  grid?: boolean
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  grid,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'gap-1 rounded-xl bg-slate-100 p-1 dark:bg-navy-900/50',
        grid ? 'grid' : 'inline-flex',
        className,
      )}
      style={grid ? { gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` } : undefined}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 active:scale-[0.97]',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
              active
                ? opt.activeClass ?? 'bg-white text-navy-800 shadow-sm dark:bg-navy-700 dark:text-white'
                : 'text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
