'use client'

import { useActionState } from 'react'
import { revokeAssistantCoachAction, type RevokeAssistantCoachState } from '@/actions/team'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { FormError } from '@/components/ui/FormError'

interface Props {
  teamId: string
  targetUserId: string
  memberName: string
}

export function RevokeAssistantCoachButton({ teamId, targetUserId, memberName }: Props) {
  const [state, action, isPending] = useActionState<RevokeAssistantCoachState, FormData>(
    revokeAssistantCoachAction,
    null,
  )

  if (state && 'success' in state) {
    return <p className="text-xs text-muted-foreground">Entzogen</p>
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="target_user_id" value={targetUserId} />
      <ConfirmButton
        confirmText={`${memberName} die Co-Trainer-Rolle wirklich entziehen?`}
        loading={isPending}
      >
        Entziehen
      </ConfirmButton>
      {state && 'error' in state && <FormError message={state.error} />}
    </form>
  )
}
