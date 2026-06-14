import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: number
  className?: string
}

export function Stars({ value, onChange, readOnly, size = 18, className }: StarsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} role="radiogroup" aria-label="Priority">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-checked={n === value}
            role="radio"
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(n === value ? 0 : n)}
            className={cn(
              'transition-transform duration-100',
              !readOnly && 'hover:scale-110 active:scale-90 cursor-pointer',
              readOnly && 'cursor-default',
            )}
          >
            <Star
              width={size}
              height={size}
              className={cn(
                'transition-colors',
                filled ? 'fill-gold-400 text-gold-400' : 'fill-transparent text-slate-300 dark:text-navy-600',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
