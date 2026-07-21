'use client'

import { useActionState, useState } from 'react'
import { updateTrainingAction, type UpdateTrainingState } from '@/actions/events'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

interface Props {
  eventId: string
  initialTitle: string
  initialDate: string
  initialTime: string
  initialLocation: string
  initialDescription: string
  rsvpCount: number
}

export function EditEventForm({
  eventId,
  initialTitle,
  initialDate,
  initialTime,
  initialLocation,
  initialDescription,
  rsvpCount,
}: Props) {
  const [state, action, isPending] = useActionState<UpdateTrainingState, FormData>(
    updateTrainingAction,
    null,
  )
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)

  const hasRsvps    = rsvpCount > 0
  const timeChanged = date !== initialDate || time !== initialTime
  const rsvpPlural  = rsvpCount === 1 ? '' : 'en'
  const rsvpVerb    = rsvpCount === 1 ? 'liegt' : 'liegen'
  const rsvpVerb2   = rsvpCount === 1 ? 'bleibt' : 'bleiben'

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="event_id" value={eventId} />

      {state && 'error' in state && <FormError message={state.error} />}

      {hasRsvps && (
        <p className="rounded-md bg-surface px-3 py-2 text-xs text-muted-foreground border border-border">
          {rsvpCount} Rückmeldung{rsvpPlural} {rsvpVerb} bereits vor. Sie {rsvpVerb2} bei jeder
          Änderung erhalten. Spieler und Guardians werden über Änderungen nicht automatisch
          benachrichtigt.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title" required>Titel</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            value={time}
            onChange={(e) => setTime(e.target.value)}
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
          defaultValue={initialLocation}
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
          defaultValue={initialDescription}
          disabled={isPending}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {timeChanged && hasRsvps ? (
        <ConfirmButton
          variant="primary"
          confirmText={`Termin wird verschoben. ${rsvpCount} bestehende Rückmeldung${rsvpPlural} ${rsvpVerb2} erhalten, es wird keine automatische Benachrichtigung versendet. Fortfahren?`}
          loading={isPending}
        >
          Änderungen speichern
        </ConfirmButton>
      ) : (
        <Button type="submit" loading={isPending} className="w-full" size="lg">
          Änderungen speichern
        </Button>
      )}
    </form>
  )
}
