import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value: number
  barColor?: string
  trackClassName?: string
  /** animate fill on mount */
  animate?: boolean
  size?: 'sm' | 'md'
}

export const Progress = ({
  value,
  barColor,
  className,
  trackClassName,
  animate = true,
  size = 'md',
  ...props
}: ProgressProps) => {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        trackClassName,
        className,
      )}
      {...props}
    >
      <div
        className={cn('h-full rounded-full origin-left transition-[width] duration-700', animate && 'animate-bar-grow')}
        style={{ width: `${v}%`, backgroundColor: barColor ?? '#2D4170' }}
      />
    </div>
  )
}
