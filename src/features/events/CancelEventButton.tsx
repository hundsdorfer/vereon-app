'use client'

import { useActionState } from 'react'
import { cancelEventAction, type CancelEventState } from '@/actions/events'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { FormError } from '@/components/ui/FormError'

interface Props {
  eventId: string
}

export function CancelEventButton({ eventId }: Props) {
  const [state, action, isPending] = useActionState<CancelEventState, FormData>(
    cancelEventAction,
    null,
  )

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="event_id" value={eventId} />
      <ConfirmButton
        variant="danger"
        confirmText="Training wirklich absagen? Bestehende Rückmeldungen bleiben als Historie erhalten."
        loading={isPending}
      >
        Training absagen
      </ConfirmButton>
      {state && 'error' in state && <FormError message={state.error} />}
    </form>
  )
}
