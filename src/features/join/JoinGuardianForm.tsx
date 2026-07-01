'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { submitJoinRequestGuardianAction, type JoinState } from '@/actions/join'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

interface Props {
  code: string
  onBack: () => void
}

export function JoinGuardianForm({ code, onBack }: Props) {
  const [state, action, isPending] = useActionState<JoinState, FormData>(
    submitJoinRequestGuardianAction,
    null,
  )

  const today = new Date().toISOString().split('T')[0]

  if (state && 'success' in state) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface-muted px-5 py-4">
          <p className="text-sm font-medium text-foreground">Anfrage gesendet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Die Anfrage wurde gesendet. Der Trainer bestätigt die Aufnahme deines Kindes.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />

      <p className="text-sm text-muted-foreground">
        Du meldest dein Kind für dieses Team an. Der Trainer muss die Anfrage bestätigen.
      </p>

      {state && 'error' in state && <FormError message={state.error} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="child_first_name" required>Vorname des Kindes</Label>
          <Input
            id="child_first_name"
            name="first_name"
            type="text"
            autoComplete="off"
            required
            placeholder="z. B. Jonas"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="child_last_name" required>Nachname des Kindes</Label>
          <Input
            id="child_last_name"
            name="last_name"
            type="text"
            autoComplete="off"
            required
            placeholder="z. B. Mustermann"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="child_date_of_birth" required>Geburtsdatum des Kindes</Label>
        <Input
          id="child_date_of_birth"
          name="child_date_of_birth"
          type="date"
          required
          max={today}
        />
      </div>

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
          Anfrage senden
        </Button>
      </div>
    </form>
  )
}
