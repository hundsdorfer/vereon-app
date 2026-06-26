import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-danger" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}
