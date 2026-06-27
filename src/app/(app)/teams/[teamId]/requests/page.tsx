import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RequestCard } from '@/features/joinRequests/RequestCard'

export const dynamic = 'force-dynamic'

export default async function RequestsPage({
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

  if (teamError || !team) notFound()

  const { data: requests, error: requestsError } = await supabase
    .from('team_join_requests')
    .select('id, request_type, created_at, team_id, players(first_name, last_name, birth_year)')
    .eq('team_id', teamId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (requestsError) {
    console.error('Requests query error', requestsError)
  }

  const pendingRequests = requests ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link
          href={`/teams/${teamId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zum Team
        </Link>
      </div>

      <PageHeader
        title="Beitrittsanfragen"
        subtitle={team.name}
      />

      <div className="mt-6">
        {pendingRequests.length === 0 ? (
          <EmptyState
            title="Keine offenen Anfragen"
            description="Sobald jemand über den Einladungslink beitreten möchte, erscheint die Anfrage hier."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {pendingRequests.length === 1
                ? '1 offene Anfrage'
                : `${pendingRequests.length} offene Anfragen`}
            </p>
            {pendingRequests.map((req) => {
              const player = Array.isArray(req.players) ? req.players[0] : req.players
              return (
                <RequestCard
                  key={req.id}
                  id={req.id}
                  teamId={req.team_id}
                  requestType={req.request_type}
                  playerFirstName={player?.first_name ?? null}
                  playerLastName={player?.last_name ?? null}
                  playerBirthYear={player?.birth_year ?? null}
                  createdAt={req.created_at}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
