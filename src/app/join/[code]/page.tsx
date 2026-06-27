import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { JoinFlowSelector } from '@/features/join/JoinFlowSelector'
import type { Json } from '@/types/database.types'

export const dynamic = 'force-dynamic'

type InviteInfo = {
  valid: boolean
  reason?: 'invalid_code' | 'not_found' | 'revoked' | 'expired' | 'max_uses_reached'
  team_name?: string
  age_group?: string | null
  gender?: string | null
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  mixed: 'Gemischt',
}

const INVALID_REASONS: Record<string, string> = {
  invalid_code: 'Dieser Einladungslink ist ungültig.',
  not_found: 'Dieser Einladungslink existiert nicht.',
  revoked: 'Dieser Einladungslink wurde deaktiviert.',
  expired: 'Dieser Einladungslink ist abgelaufen.',
  max_uses_reached: 'Dieser Einladungslink ist nicht mehr verfügbar.',
}

function parseInviteInfo(raw: Json): InviteInfo {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, reason: 'invalid_code' }
  }
  return raw as unknown as InviteInfo
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  const { data: rawInfo, error: rpcError } = await supabase.rpc(
    'get_public_invitation_info_by_code',
    { p_code: code },
  )

  const info = rpcError || rawInfo === null ? { valid: false, reason: 'invalid_code' as const } : parseInviteInfo(rawInfo)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redirectParam = encodeURIComponent(`/join/${code}`)

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center px-5 py-4 border-b border-border bg-surface">
        <span className="text-lg font-bold text-foreground">Vereon</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          {!info.valid ? (
            <Card>
              <CardHeader>
                <h1 className="text-base font-semibold text-foreground">
                  Einladungslink ungültig
                </h1>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {INVALID_REASONS[info.reason ?? 'invalid_code'] ??
                    'Dieser Einladungslink ist nicht gültig.'}{' '}
                  Bitte wende dich an den Trainer.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <h1 className="text-base font-semibold text-foreground">
                    Einladung zum Team
                  </h1>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-foreground">{info.team_name}</p>
                  {(info.age_group || info.gender) && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {info.age_group && (
                        <span className="text-sm text-muted-foreground">
                          Altersgruppe: {info.age_group}
                        </span>
                      )}
                      {info.gender && (
                        <span className="text-sm text-muted-foreground">
                          {GENDER_LABEL[info.gender] ?? info.gender}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {!user ? (
                <Card>
                  <CardHeader>
                    <h2 className="text-base font-semibold text-foreground">
                      Anmelden zum Beitreten
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Um eine Beitrittsanfrage zu stellen, musst du angemeldet sein.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/login?redirect=${redirectParam}`}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
                      >
                        Anmelden
                      </Link>
                      <Link
                        href={`/register?redirect=${redirectParam}`}
                        className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
                      >
                        Konto erstellen
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <h2 className="text-base font-semibold text-foreground">
                      Beitrittsanfrage stellen
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <JoinFlowSelector code={code} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
