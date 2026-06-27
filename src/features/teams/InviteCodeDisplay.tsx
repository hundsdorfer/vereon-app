'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  code: string
  origin: string
}

export function InviteCodeDisplay({ code, origin }: Props) {
  const joinUrl = `${origin}/join/${code}`
  const [codeCopied, setCodeCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // Clipboard nicht verfügbar
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch {
      // Clipboard nicht verfügbar
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Einladungscode
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-md border border-border bg-surface-muted px-4 py-3">
            <span className="select-all font-mono text-xl font-bold tracking-widest text-foreground">
              {code}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={copyCode}
            className="flex-shrink-0"
          >
            {codeCopied ? 'Kopiert ✓' : 'Code kopieren'}
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Link für Eltern
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={joinUrl}
            aria-label="Einladungslink"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground select-all focus:outline-none focus:ring-2 focus:ring-primary"
            onFocus={(e) => e.target.select()}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={copyUrl}
            className="flex-shrink-0 sm:self-start"
          >
            {urlCopied ? 'Kopiert ✓' : 'Link kopieren'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Code oder Link per WhatsApp oder E-Mail teilen. Erwachsene Spieler können selbst eine Beitrittsanfrage stellen, Eltern können ihr Kind anmelden.
        </p>
      </div>
    </div>
  )
}
