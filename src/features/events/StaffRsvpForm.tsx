'use client'

import { useActionState } from 'react'
import {
  respondToEventAsStaffAction,
  type RespondToEventAsStaffState,
} from '@/actions/events'
import { FormError } from '@/components/ui/FormError'

interface Props {
  eventId: string
  currentStatus: string | null
  currentNote: string | null
  isCancelled: boolean
  hasStarted: boolean
}

export function StaffRsvpForm({
  eventId,
  currentStatus,
  currentNote,
  isCancelled,
  hasStarted,
}: Props) {
  const [state, action, isPending] = useActionState<RespondToEventAsStaffState, FormData>(
    respondToEventAsStaffAction,
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />

      <p className="text-sm font-semibold text-foreground">Deine Rückmeldung</p>

      {isCancelled ? (
        <p className="text-sm text-muted-foreground">Rückmeldung ist nicht mehr möglich.</p>
      ) : hasStarted ? (
        <p className="text-sm text-muted-foreground">
          Dieses Training hat bereits begonnen. Die Rückmeldung kann nicht mehr geändert werden.
        </p>
      ) : (
        <>
          {state?.error && <FormError message={state.error} />}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="rsvp_status"
              value="attending"
              disabled={isPending}
              className={btnClass(currentStatus === 'attending')}
            >
              Zusagen
            </button>
            <button
              type="submit"
              name="rsvp_status"
              value="maybe"
              disabled={isPending}
              className={btnClass(currentStatus === 'maybe')}
            >
              Vielleicht
            </button>
            <button
              type="submit"
              name="rsvp_status"
              value="declined"
              disabled={isPending}
              className={btnClass(currentStatus === 'declined')}
            >
              Absagen
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="staff-rsvp-note" className="text-xs text-muted-foreground">
              Notiz (optional)
            </label>
            <textarea
              id="staff-rsvp-note"
              name="rsvp_note"
              rows={2}
              defaultValue={currentNote ?? ''}
              placeholder="z. B. komme 10 Minuten später"
              disabled={isPending}
              className="flex w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </>
      )}
    </form>
  )
}

function btnClass(active: boolean): string {
  const base =
    'rounded-md px-4 py-2 text-sm font-medium transition-opacity touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'
  return active
    ? `${base} bg-primary text-primary-foreground`
    : `${base} bg-surface border border-border text-foreground hover:opacity-80`
}
