'use client'

import { useActionState } from 'react'
import { removePlayerFromTeamAction, type RemovePlayerActionState } from '@/actions/players'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { FormError } from '@/components/ui/FormError'

interface Props {
  assignmentId: string
  teamId: string
  playerName: string
}

export function RemovePlayerButton({ assignmentId, teamId, playerName }: Props) {
  const [state, action, isPending] = useActionState<RemovePlayerActionState, FormData>(
    removePlayerFromTeamAction,
    null,
  )

  if (state && 'success' in state) {
    return <p className="text-xs text-muted-foreground">Entfernt</p>
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="teamId" value={teamId} />
      <ConfirmButton
        confirmText={`${playerName} wirklich entfernen? Zusagen/Anwesenheits-Historie bleibt erhalten.`}
        loading={isPending}
      >
        Entfernen
      </ConfirmButton>
      {state && 'error' in state && <FormError message={state.error} />}
    </form>
  )
}
