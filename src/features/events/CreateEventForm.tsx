'use client'

import { useActionState } from 'react'
import { createEventAction, type CreateEventState } from '@/actions/events'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

interface Props {
  teamId: string
}

export function CreateEventForm({ teamId }: Props) {
  const [state, action, isPending] = useActionState<CreateEventState, FormData>(
    createEventAction,
    null,
  )

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="team_id" value={teamId} />

      {state && 'error' in state && <FormError message={state.error} />}

      <div className="space-y-1.5">
        <Label htmlFor="title" required>Titel</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          placeholder="z. B. Dienstags-Training"
          autoComplete="off"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="starts_at_date" required>Datum</Label>
          <Input
            id="starts_at_date"
            name="starts_at_date"
            type="date"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="starts_at_time" required>Uhrzeit</Label>
          <Input
            id="starts_at_time"
            name="starts_at_time"
            type="time"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Ort</Label>
        <Input
          id="location"
          name="location"
          type="text"
          placeholder="z. B. Sportplatz Hauptstraße"
          autoComplete="off"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Hinweise</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Optionale Hinweise für die Spieler"
          disabled={isPending}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Training erstellen
      </Button>
    </form>
  )
}
