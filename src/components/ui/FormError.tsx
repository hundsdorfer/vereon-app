import { cn } from '@/lib/utils'

interface FormErrorProps {
  message?: string | string[] | null
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  const messages = Array.isArray(message) ? message : [message]

  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border-l-4 border-danger bg-surface-muted px-4 py-3',
        className,
      )}
    >
      {messages.map((msg, i) => (
        <p key={i} className="text-sm text-danger">
          {msg}
        </p>
      ))}
    </div>
  )
}
