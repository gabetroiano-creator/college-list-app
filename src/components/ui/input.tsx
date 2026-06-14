import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, suffix, type, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 dark:border-navy-600 dark:bg-navy-900/40 dark:text-white tabular-nums',
          suffix && 'pr-10',
          className,
        )}
        {...props}
      />
    )
    if (!suffix) return input
    return (
      <div className="relative">
        {input}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      </div>
    )
  },
)
Input.displayName = 'Input'
