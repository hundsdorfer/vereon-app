import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-6 py-14 text-center',
        className,
      )}
    >
      <EmptyIcon />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function EmptyIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="7"
        y="10"
        width="26"
        height="22"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted"
      />
      <path
        d="M7 17h26"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted"
      />
      <path
        d="M14 14h0.01M18 14h0.01M22 14h0.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted"
      />
      <path
        d="M13 23h8M13 27h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-border"
      />
    </svg>
  )
}
