'use client'

import { useActionState } from 'react'
import { respondToEventAction, type RespondToEventState } from '@/actions/events'
import { FormError } from '@/components/ui/FormError'

interface Props {
  teamId: string
  eventId: string
  playerId: string
  playerName: string
  currentStatus: string | null
  currentNote: string | null
  isCancelled: boolean
}

export function RsvpForm({
  teamId,
  eventId,
  playerId,
  playerName,
  currentStatus,
  currentNote,
  isCancelled,
}: Props) {
  const [state, action, isPending] = useActionState<RespondToEventState, FormData>(
    respondToEventAction,
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="team_id"   value={teamId} />
      <input type="hidden" name="event_id"  value={eventId} />
      <input type="hidden" name="player_id" value={playerId} />

      <p className="text-sm font-semibold text-foreground">{playerName}</p>

      {isCancelled ? (
        <p className="text-sm text-muted-foreground">Dieses Training wurde abgesagt.</p>
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
            <label
              htmlFor={`note-${playerId}`}
              className="text-xs text-muted-foreground"
            >
              Notiz (optional)
            </label>
            <textarea
              id={`note-${playerId}`}
              name="rsvp_note"
              rows={2}
              defaultValue={currentNote ?? ''}
              placeholder="z. B. komme 10 Minuten später"
              disabled={isPending}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
