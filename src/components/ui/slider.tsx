import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (v: number) => void
  className?: string
  /** hex for the filled portion */
  fillColor?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Slider({
  value,
  min = 0,
  max = 10,
  step = 1,
  onValueChange,
  className,
  fillColor = '#C9A84C',
  disabled,
  ...rest
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className={cn('clean-range', disabled && 'opacity-50', className)}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(Number(e.target.value))}
      style={{
        background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, var(--track, #E2E8F0) ${pct}%, var(--track, #E2E8F0) 100%)`,
      }}
      {...rest}
    />
  )
}
