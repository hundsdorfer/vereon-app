'use client'

import { useState } from 'react'
import { JoinSelfForm, type ProfileData } from '@/features/join/JoinSelfForm'
import { JoinGuardianForm } from '@/features/join/JoinGuardianForm'

type Mode = 'selector' | 'self' | 'guardian'

interface Props {
  code: string
  profile: ProfileData | null
}

export function JoinFlowSelector({ code, profile }: Props) {
  const [mode, setMode] = useState<Mode>('selector')

  if (mode === 'self') {
    return <JoinSelfForm code={code} profile={profile} onBack={() => setMode('selector')} />
  }

  if (mode === 'guardian') {
    return <JoinGuardianForm code={code} onBack={() => setMode('selector')} />
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Wie möchtest du dem Team beitreten?
      </p>

      <button
        type="button"
        onClick={() => setMode('self')}
        className="w-full rounded-lg border border-border bg-surface px-5 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
      >
        <p className="text-sm font-medium text-foreground">Ich trete selbst bei</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Als Spieler oder Erwachsener
        </p>
      </button>

      <button
        type="button"
        onClick={() => setMode('guardian')}
        className="w-full rounded-lg border border-border bg-surface px-5 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
      >
        <p className="text-sm font-medium text-foreground">Ich melde mein Kind an</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Als Erziehungsberechtigte/r
        </p>
      </button>
    </div>
  )
}
