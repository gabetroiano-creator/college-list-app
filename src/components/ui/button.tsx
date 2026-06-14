import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-navy-900 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 text-white hover:bg-navy-700 hover:shadow-lift dark:bg-navy-600 dark:hover:bg-navy-500',
        gold: 'bg-gold-400 text-navy-900 font-semibold hover:bg-gold-300 hover:shadow-lift',
        outline:
          'border border-slate-200 bg-white text-navy-700 hover:bg-slate-100 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700',
        ghost: 'text-navy-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700',
        subtle: 'bg-slate-100 text-navy-700 hover:bg-slate-200 dark:bg-navy-700 dark:text-slate-200 dark:hover:bg-navy-600',
        danger: 'bg-red-500 text-white hover:bg-red-400 hover:shadow-lift',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
