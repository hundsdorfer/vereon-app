'use client'

import { useActionState, useState } from 'react'
import { deleteTrainingAction, type DeleteTrainingState } from '@/actions/events'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface Props {
  eventId: string
}

export function DeleteTrainingForm({ eventId }: Props) {
  const [state, action, isPending] = useActionState<DeleteTrainingState, FormData>(
    deleteTrainingAction,
    null,
  )
  const [confirmation, setConfirmation] = useState('')

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="space-y-1.5">
        <Label htmlFor="delete_confirmation">
          Zum endgültigen Löschen exakt <strong>LÖSCHEN</strong> eingeben
        </Label>
        <Input
          id="delete_confirmation"
          name="confirmation"
          type="text"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        variant="danger"
        loading={isPending}
        disabled={confirmation !== 'LÖSCHEN'}
      >
        Training endgültig löschen
      </Button>

      {state && 'error' in state && <FormError message={state.error} />}
    </form>
  )
}
