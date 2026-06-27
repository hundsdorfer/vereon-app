import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { InviteCodeDisplay } from '@/features/teams/InviteCodeDisplay'

export const dynamic = 'force-dynamic'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .eq('is_active', true)
    .single()

  if (teamError || !team) {
    if (teamError && teamError.code !== 'PGRST116') {
      console.error('Invite page team query error', {
        message: teamError.message,
        code: teamError.code,
      })
    }
    notFound()
  }

  const { data: inviteLink } = await supabase
    .from('team_invitation_links')
    .select('public_code')
    .eq('team_id', teamId)
    .is('revoked_at', null)
    .not('public_code', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const origin = `${proto}://${host}`

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5">
        <Link
          href={`/teams/${teamId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zu {team.name}
        </Link>
      </div>

      <PageHeader
        title="Spieler & Eltern einladen"
        subtitle={team.name}
      />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Einladungscode</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Teile diesen Code oder Link mit Spielern oder Eltern. Erwachsene Spieler können selbst eine Beitrittsanfrage stellen, Eltern können ihr Kind anmelden. Du entscheidest, wer aufgenommen wird.
            </p>
          </CardHeader>
          <CardContent>
            {inviteLink?.public_code ? (
              <InviteCodeDisplay code={inviteLink.public_code} origin={origin} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Kein aktiver Einladungscode gefunden. Bitte wende dich an den Support.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
