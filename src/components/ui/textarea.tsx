import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLen?: number
  showCount?: boolean
  highlight?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLen, showCount, highlight, value, onChange, ...props }, ref) => {
    const len = typeof value === 'string' ? value.length : 0
    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLen}
          onChange={onChange}
          className={cn(
            'w-full min-h-[88px] rounded-lg border bg-white px-3 py-2 text-sm leading-relaxed text-navy-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 dark:bg-navy-900/40 dark:text-white resize-y',
            highlight ? 'border-gold-300 dark:border-gold-500/50' : 'border-slate-200 dark:border-navy-600',
            className,
          )}
          {...props}
        />
        {(showCount || maxLen) && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-xs tabular-nums',
                maxLen && len >= maxLen ? 'text-red-500' : 'text-slate-400',
              )}
            >
              {len}
              {maxLen ? ` / ${maxLen}` : ''}
            </span>
          </div>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
