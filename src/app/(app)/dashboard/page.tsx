import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatTrainingDateTime } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { RsvpStatusBadge } from '@/components/ui/RsvpStatusBadge'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

const NON_TRAINER_ROLES = ['player', 'guardian']

type EventRow = {
  id: string
  title: string
  starts_at: string
  location: string | null
  team_id: string
  is_cancelled: boolean
  teams: { id: string; name: string } | null
}

type AttendanceRow = {
  event_id: string
  player_id: string
  rsvp_status: string | null
  rsvp_note: string | null
}

type PlayerEntry = { id: string; first_name: string; last_name: string }

type PendingRequestRow = {
  id: string
  team_id: string
  request_type: 'self_player' | 'guardian_child'
  teams: { id: string; name: string } | null
  players: { id: string; first_name: string; last_name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const now = new Date().toISOString()

  const [
    { data: memberships },
    { data: profile },
    { data: rawEvents },
    { data: pendingRequestRows },
  ] = await Promise.all([
    supabase
      .from('team_memberships')
      .select('team_id')
      .eq('user_id', user?.id ?? '')
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('onboarding_role')
      .eq('id', user?.id ?? '')
      .single(),
    supabase
      .from('events')
      .select('id, title, starts_at, location, team_id, is_cancelled, teams(id, name)')
      .eq('event_type', 'training')
      .gte('starts_at', now)
      .order('starts_at')
      .limit(5),
    supabase
      .from('team_join_requests')
      .select('id, team_id, request_type, teams(id, name), players(id, first_name, last_name)')
      .eq('status', 'pending'),
  ])

  const trainerTeamIds = (memberships ?? []).map((m) => m.team_id)
  const hasTrainerMembership = trainerTeamIds.length > 0
  const onboardingRole = profile?.onboarding_role ?? null
  const isNonTrainerProfile =
    onboardingRole !== null && NON_TRAINER_ROLES.includes(onboardingRole)
  const showTrainerUI = hasTrainerMembership || !isNonTrainerProfile

  const trainerPrimaryAction =
    trainerTeamIds.length === 0
      ? { label: 'Team erstellen', href: '/teams/new' }
      : trainerTeamIds.length === 1
        ? { label: 'Training erstellen', href: `/teams/${trainerTeamIds[0]}/events/new` }
        : { label: 'Teams öffnen', href: '/teams' }

  const events = (rawEvents as EventRow[] | null) ?? []
  const pending = (pendingRequestRows as PendingRequestRow[] | null) ?? []

  // Trainer: pending requests grouped by team (filtered to own trainer teams)
  const trainerTeamIdSet = new Set(trainerTeamIds)
  const requestsByTeam = new Map<string, { teamName: string; count: number }>()
  if (showTrainerUI) {
    for (const req of pending) {
      if (trainerTeamIds.length > 0 && !trainerTeamIdSet.has(req.team_id)) continue
      const existing = requestsByTeam.get(req.team_id) ?? {
        teamName: req.teams?.name ?? 'Team',
        count: 0,
      }
      existing.count++
      requestsByTeam.set(req.team_id, existing)
    }
  }

  // Non-trainer: own pending requests (RLS via tjr_select_requester returns only own rows)
  const ownPendingRequests = showTrainerUI ? [] : pending

  let attendanceRows: AttendanceRow[] = []
  let playerMap = new Map<string, PlayerEntry>()

  if (events.length > 0) {
    const eventIds = events.map((e) => e.id)
    const { data: rawAttendance } = await supabase
      .from('event_attendance')
      .select('event_id, player_id, rsvp_status, rsvp_note')
      .in('event_id', eventIds)

    attendanceRows = rawAttendance ?? []

    const playerIds = [...new Set(attendanceRows.map((a) => a.player_id))]
    if (playerIds.length > 0) {
      const { data: playersData } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', playerIds)
      playerMap = new Map((playersData ?? []).map((p) => [p.id, p]))
    }
  }

  function getEventSummary(eventId: string) {
    const rows = attendanceRows.filter((a) => a.event_id === eventId)
    return {
      total: rows.length,
      attending: rows.filter((a) => a.rsvp_status === 'attending').length,
      noAnswer: rows.filter((a) => !a.rsvp_status).length,
    }
  }

  function getEventAttendance(eventId: string) {
    return attendanceRows
      .filter((a) => a.event_id === eventId)
      .map((a) => ({ ...a, player: playerMap.get(a.player_id) ?? null }))
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Dashboard" subtitle={user?.email ?? ''} />

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Nächste Trainings</h2>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Trainings geplant.</p>
            ) : (
              <ul className="divide-y divide-border">
                {events.map((event) => {
                  const href = `/teams/${event.team_id}/events/${event.id}`
                  const teamName = event.teams?.name

                  if (showTrainerUI) {
                    const { total, attending, noAnswer } = getEventSummary(event.id)
                    return (
                      <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                        <Link href={href} className="block group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {event.title}
                                {event.is_cancelled && <Badge variant="danger">Abgesagt</Badge>}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatTrainingDateTime(event.starts_at)}
                                {teamName && trainerTeamIds.length > 1 && ` · ${teamName}`}
                              </p>
                            </div>
                            <p className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                              {attending}/{total} zugesagt
                              {noAnswer > 0 && ` · ${noAnswer} offen`}
                            </p>
                          </div>
                        </Link>
                      </li>
                    )
                  }

                  const rows = getEventAttendance(event.id)
                  if (rows.length === 0) {
                    return (
                      <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                        <Link href={href} className="block group">
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {event.title}
                            {event.is_cancelled && <Badge variant="danger">Abgesagt</Badge>}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatTrainingDateTime(event.starts_at)}
                          </p>
                        </Link>
                      </li>
                    )
                  }

                  return rows.map((a) => {
                    const playerName = a.player
                      ? `${a.player.first_name} ${a.player.last_name}`
                      : null
                    return (
                      <li key={`${event.id}-${a.player_id}`} className="py-3 first:pt-0 last:pb-0">
                        <Link href={href} className="block group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {playerName && (
                                <p className="mb-0.5 text-xs font-semibold text-foreground">
                                  {playerName}
                                </p>
                              )}
                              <p className="flex items-center gap-2 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {event.title}
                                {event.is_cancelled && <Badge variant="danger">Abgesagt</Badge>}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatTrainingDateTime(event.starts_at)}
                              </p>
                            </div>
                            <div className="mt-0.5 flex-shrink-0">
                              <RsvpStatusBadge status={a.rsvp_status} />
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {showTrainerUI && requestsByTeam.size > 0 && (
          <Card>
            <CardContent>
              <ul className="divide-y divide-border">
                {[...requestsByTeam.entries()].map(([teamId, { teamName, count }]) => (
                  <li key={teamId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{count}</span>{' '}
                      offene Anfrage{count !== 1 ? 'n' : ''}{' '}
                      <span className="text-muted-foreground">· {teamName}</span>
                    </p>
                    <Link
                      href={`/teams/${teamId}/requests`}
                      className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
                    >
                      Ansehen →
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {!showTrainerUI && ownPendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">Offene Beitrittsanfragen</h2>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {ownPendingRequests.map((req) => {
                  const isSelf = req.request_type === 'self_player'
                  const playerName = req.players
                    ? `${req.players.first_name} ${req.players.last_name}`
                    : null
                  const mainText = isSelf
                    ? 'Deine Beitrittsanfrage'
                    : playerName ?? 'Beitrittsanfrage'
                  const teamText = req.teams?.name ?? null

                  return (
                    <li key={req.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-foreground">{mainText}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {teamText ? `Team: ${teamText}` : 'Teambeitritt angefragt'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Wartet auf Bestätigung durch den Trainer
                      </p>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-foreground">
                {showTrainerUI
                  ? trainerTeamIds.length === 0
                    ? 'Noch kein Team erstellt.'
                    : `${trainerTeamIds.length} ${trainerTeamIds.length === 1 ? 'Team' : 'Teams'}`
                  : 'Meine Teams'}
              </p>
              <Link
                href={showTrainerUI ? trainerPrimaryAction.href : '/teams'}
                className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
              >
                {showTrainerUI ? `${trainerPrimaryAction.label} →` : 'Zu meinen Teams →'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
