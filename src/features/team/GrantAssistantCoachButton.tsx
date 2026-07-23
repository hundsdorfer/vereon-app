'use client'

import { useActionState } from 'react'
import { grantAssistantCoachAction, type GrantAssistantCoachState } from '@/actions/team'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

interface Props {
  teamId: string
  targetUserId: string
}

export function GrantAssistantCoachButton({ teamId, targetUserId }: Props) {
  const [state, action, isPending] = useActionState<GrantAssistantCoachState, FormData>(
    grantAssistantCoachAction,
    null,
  )

  if (state && 'success' in state) {
    return <p className="text-xs text-muted-foreground">Co-Trainer</p>
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="target_user_id" value={targetUserId} />
      <Button type="submit" variant="secondary" size="sm" loading={isPending}>
        Co-Trainer machen
      </Button>
      {state && 'error' in state && <FormError message={state.error} />}
    </form>
  )
}
