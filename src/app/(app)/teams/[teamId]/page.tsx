import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv',
  pending_affiliation: 'Vereinszuordnung angefragt',
  club_affiliated: 'Vereinsteam',
  archived: 'Archiviert',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  pending_affiliation: 'warning',
  club_affiliated: 'outline',
  archived: 'default',
}

const OWNERSHIP_LABEL: Record<string, string> = {
  independent: 'Eigenständig',
  club_managed: 'Vereinsgeführt',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  mixed: 'Gemischt',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, age_group, gender, ownership_type, status, team_type, created_at')
    .eq('id', teamId)
    .eq('is_active', true)
    .single()

  if (error || !team) {

    if (error && error.code !== 'PGRST116') {
      console.error('Team detail query error', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
    }
    notFound()
  }

  const { count: pendingRequestCount } = await supabase
    .from('team_join_requests')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('status', 'pending')

  const statusVariant = STATUS_VARIANT[team.status] ?? 'default'
  const statusLabel = STATUS_LABEL[team.status] ?? team.status

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link
          href="/teams"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zu Meine Teams
        </Link>
      </div>

      <PageHeader
        title={team.name}
        subtitle={OWNERSHIP_LABEL[team.ownership_type] ?? team.ownership_type}
        action={<Badge variant={statusVariant}>{statusLabel}</Badge>}
      />

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Teamdetails</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {team.age_group && (
                <div className="flex gap-4">
                  <dt className="w-36 flex-shrink-0 text-sm text-muted-foreground">Altersgruppe</dt>
                  <dd className="text-sm text-foreground">{team.age_group}</dd>
                </div>
              )}
              {team.gender && (
                <div className="flex gap-4">
                  <dt className="w-36 flex-shrink-0 text-sm text-muted-foreground">Geschlecht</dt>
                  <dd className="text-sm text-foreground">{GENDER_LABEL[team.gender] ?? team.gender}</dd>
                </div>
              )}
              <div className="flex gap-4">
                <dt className="w-36 flex-shrink-0 text-sm text-muted-foreground">Typ</dt>
                <dd className="text-sm text-foreground">{OWNERSHIP_LABEL[team.ownership_type] ?? team.ownership_type}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-36 flex-shrink-0 text-sm text-muted-foreground">Status</dt>
                <dd className="text-sm text-foreground">{statusLabel}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-36 flex-shrink-0 text-sm text-muted-foreground">Erstellt am</dt>
                <dd className="text-sm text-foreground">{formatDate(team.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Spieler</h2>
              <Badge variant="outline">Folgt später</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Spielerverwaltung und Anwesenheitserfassung kommen in einer späteren Phase.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Einladungslink</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Teile den Einladungscode mit Spielern oder Eltern. Erwachsene können selbst beitreten, Eltern können ihr Kind anmelden.
            </p>
            <div className="mt-4">
              <Link
                href={`/teams/${team.id}/invite`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
              >
                Spieler & Eltern einladen
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Beitrittsanfragen</h2>
              {pendingRequestCount !== null && pendingRequestCount > 0 && (
                <Badge variant="warning">{pendingRequestCount} offen</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingRequestCount !== null && pendingRequestCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {pendingRequestCount === 1
                  ? 'Eine Person möchte deinem Team beitreten.'
                  : `${pendingRequestCount} Personen möchten deinem Team beitreten.`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine offenen Anfragen.
              </p>
            )}
            <div className="mt-4">
              <Link
                href={`/teams/${team.id}/requests`}
                className="inline-flex items-center justify-center rounded-md bg-surface border border-border px-4 py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
              >
                Anfragen ansehen
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
