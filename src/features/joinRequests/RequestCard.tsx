'use client'

import { useActionState } from 'react'
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  type JoinRequestActionState,
} from '@/actions/joinRequests'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'

type Props = {
  id: string
  teamId: string
  requestType: string
  playerFirstName: string | null
  playerLastName: string | null
  playerBirthYear: number | null
  createdAt: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function RequestCard({
  id,
  teamId,
  requestType,
  playerFirstName,
  playerLastName,
  playerBirthYear,
  createdAt,
}: Props) {
  const [approveState, approveAction, isApprovePending] =
    useActionState<JoinRequestActionState, FormData>(approveJoinRequestAction, null)
  const [rejectState, rejectAction, isRejectPending] =
    useActionState<JoinRequestActionState, FormData>(rejectJoinRequestAction, null)

  const isProcessing = isApprovePending || isRejectPending
  const isDone =
    (approveState && 'success' in approveState) ||
    (rejectState  && 'success' in rejectState)

  const playerName =
    [playerFirstName, playerLastName].filter(Boolean).join(' ') || '(Name nicht verfügbar)'
  const typeLabel =
    requestType === 'self_player'
      ? 'Spieler möchte selbst beitreten'
      : 'Kind wurde angemeldet'

  if (isDone) {
    const wasApproved = approveState && 'success' in approveState
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            {wasApproved ? `${playerName} wurde angenommen.` : `${playerName} wurde abgelehnt.`}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{playerName}</p>
            {playerBirthYear && (
              <p className="text-xs text-muted-foreground">Jahrgang {playerBirthYear}</p>
            )}
            <p className="text-xs text-muted-foreground">{typeLabel}</p>
            <p className="text-xs text-muted-foreground">
              Eingegangen am {formatDate(createdAt)}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <form action={approveAction}>
              <input type="hidden" name="requestId" value={id} />
              <input type="hidden" name="teamId" value={teamId} />
              <Button
                type="submit"
                size="sm"
                loading={isApprovePending}
                disabled={isProcessing}
              >
                Annehmen
              </Button>
            </form>
            <form action={rejectAction}>
              <input type="hidden" name="requestId" value={id} />
              <input type="hidden" name="teamId" value={teamId} />
              <Button
                type="submit"
                variant="danger"
                size="sm"
                loading={isRejectPending}
                disabled={isProcessing}
              >
                Ablehnen
              </Button>
            </form>
          </div>
        </div>

        {approveState && 'error' in approveState && (
          <div className="mt-3">
            <FormError message={approveState.error} />
          </div>
        )}
        {rejectState && 'error' in rejectState && (
          <div className="mt-3">
            <FormError message={rejectState.error} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
