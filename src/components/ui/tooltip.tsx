import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[60] max-w-xs rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-lift animate-scale-in',
        className,
      )}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className="fill-navy-900" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'

/** Convenience: an info/help tooltip with a "?" trigger. */
export function InfoTooltip({
  children,
  className,
  icon,
}: {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <TooltipRoot delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-gold-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
            className,
          )}
        >
          {icon ?? <HelpCircle className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </TooltipRoot>
  )
}
