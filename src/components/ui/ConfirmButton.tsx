'use client'

import { useState, type ReactNode } from 'react'
import { Button } from './Button'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ConfirmButtonProps {
  children: ReactNode
  confirmText: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
}

/**
 * Zweistufiger Button für riskante Aktionen ohne Modal:
 * erster Klick zeigt Warntext + Bestätigen/Abbrechen, "Bestätigen"
 * ist type="submit" und löst das umgebende <form> aus.
 */
export function ConfirmButton({
  children,
  confirmText,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
  size = 'sm',
  loading = false,
  disabled = false,
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        {children}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-[16rem] text-right text-xs text-muted-foreground">{confirmText}</p>
      <div className="flex gap-2">
        <Button type="submit" variant={variant} size={size} loading={loading} disabled={disabled}>
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={size}
          disabled={loading}
          onClick={() => setConfirming(false)}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
