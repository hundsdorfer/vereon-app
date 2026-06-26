import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-surface-muted text-muted-foreground border-border',
  success: 'bg-success-subtle text-success border-success-subtle',
  warning: 'bg-warning-subtle text-warning border-warning-subtle',
  danger:  'bg-danger-subtle text-danger border-danger-subtle',
  outline: 'bg-transparent text-foreground border-border',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
