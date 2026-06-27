'use client'

import { useActionState } from 'react'
import { submitJoinRequestSelfAction, type JoinState } from '@/actions/join'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

export type ProfileData = {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
}

interface Props {
  code: string
  profile: ProfileData | null
  onBack: () => void
}

function formatDateOfBirth(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

export function JoinSelfForm({ code, profile, onBack }: Props) {
  const [state, action, isPending] = useActionState<JoinState, FormData>(
    submitJoinRequestSelfAction,
    null,
  )

  if (state && 'success' in state) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface-muted px-5 py-4">
          <p className="text-sm font-medium text-foreground">Anfrage gesendet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Deine Anfrage wurde gesendet. Der Trainer bestätigt deine Aufnahme.
          </p>
        </div>
      </div>
    )
  }

  if (!profile?.first_name || !profile?.last_name) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface-muted px-5 py-4">
          <p className="text-sm font-medium text-foreground">Profil unvollständig</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dein Profil enthält keinen vollständigen Namen. Bitte ergänze Vor- und Nachname in den Profileinstellungen.
          </p>
        </div>
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Zurück
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />

      <div className="rounded-md border border-border bg-surface-muted px-5 py-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Deine Profildaten
        </p>
        <p className="text-sm font-semibold text-foreground">
          {profile.first_name} {profile.last_name}
        </p>
        {profile.date_of_birth && (
          <p className="text-sm text-muted-foreground">
            Geburtsdatum: {formatDateOfBirth(profile.date_of_birth)}
          </p>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Diese Daten werden für dein Spielerprofil verwendet.
        </p>
      </div>

      {state && 'error' in state && <FormError message={state.error} />}

      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isPending}
          className="flex-1"
        >
          Zurück
        </Button>
        <Button type="submit" loading={isPending} size="lg" className="flex-1">
          Beitrittsanfrage senden
        </Button>
      </div>
    </form>
  )
}
