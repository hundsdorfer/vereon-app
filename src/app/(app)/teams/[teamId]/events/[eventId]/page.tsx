import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatTrainingDateTime } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RsvpForm } from '@/features/events/RsvpForm'
import { StaffRsvpForm } from '@/features/events/StaffRsvpForm'
import { CancelEventButton } from '@/features/events/CancelEventButton'
import { DeleteTrainingForm } from '@/features/events/DeleteTrainingForm'
import {
  TRAINING_CANCEL_ROLES,
  TRAINING_DELETE_ROLES,
  TRAINING_EDIT_ROLES,
  TRAINING_STAFF_RSVP_ROLES,
} from '@/lib/permissions'

export const dynamic = 'force-dynamic'

type AttendanceWithPlayer = {
  id: string
  player_id: string
  rsvp_status: string | null
  rsvp_note: string | null
  responded_at: string | null
  player: { id: string; first_name: string; last_name: string } | null
}

type StaffRsvpRow = {
  user_id: string
  full_name: string | null
  rsvp_status: string | null
  rsvp_note: string | null
  responded_at: string | null
  is_active_trainer: boolean
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; eventId: string }>
}) {
  const { teamId, eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: team },
    { data: event },
    { data: isTrainer },
    { data: canCancel },
    { data: canEdit },
    { data: canDelete },
    { data: canSeeStaffRsvp },
  ] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('events')
      .select('id, title, event_type, starts_at, location, description, is_cancelled')
      .eq('id', eventId)
      .eq('team_id', teamId)
      .single(),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: ['team_owner', 'head_coach', 'assistant_coach', 'team_manager'],
    }),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: TRAINING_CANCEL_ROLES,
    }),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: TRAINING_EDIT_ROLES,
    }),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: TRAINING_DELETE_ROLES,
    }),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: TRAINING_STAFF_RSVP_ROLES,
    }),
  ])

  if (!team || !event) notFound()
  if (event.event_type !== 'training') notFound()

  const hasStarted = new Date(event.starts_at) <= new Date()

  const [
    { data: attendanceRows, error: attendanceError },
    { data: staffRsvpExistenceRows, error: staffRsvpExistenceError },
    staffRsvpListResult,
  ] = await Promise.all([
    supabase
      .from('event_attendance')
      .select('id, player_id, rsvp_status, rsvp_note, responded_at')
      .eq('event_id', eventId),
    supabase
      .from('event_staff_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .limit(1),
    canSeeStaffRsvp
      ? supabase.rpc('list_staff_rsvps_for_event', { p_event_id: eventId })
      : Promise.resolve({ data: null, error: null }),
  ])

  if (attendanceError) {
    console.error('Event detail attendance query error', {
      message: attendanceError.message,
      code: attendanceError.code,
    })
  }

  if (staffRsvpExistenceError) {
    console.error('Event detail staff RSVP existence query error', {
      message: staffRsvpExistenceError.message,
      code: staffRsvpExistenceError.code,
    })
  }

  if (staffRsvpListResult.error) {
    console.error('Event detail staff RSVP list query error', {
      message: staffRsvpListResult.error.message,
      code: staffRsvpListResult.error.code,
    })
  }

  const playerIds = (attendanceRows ?? []).map((a) => a.player_id)
  let playerMap = new Map<string, { id: string; first_name: string; last_name: string }>()

  if (playerIds.length > 0) {
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, first_name, last_name')
      .in('id', playerIds)

    if (playersError) {
      console.error('Event detail players query error', {
        message: playersError.message,
        code: playersError.code,
      })
    }

    playerMap = new Map((playersData ?? []).map((p) => [p.id, p]))
  }

  const attendance: AttendanceWithPlayer[] = (attendanceRows ?? []).map((a) => ({
    ...a,
    player: playerMap.get(a.player_id) ?? null,
  }))

  const attending = attendance.filter((a) => a.rsvp_status === 'attending')
  const declined  = attendance.filter((a) => a.rsvp_status === 'declined')
  const maybe     = attendance.filter((a) => a.rsvp_status === 'maybe')
  const noAnswer  = attendance.filter((a) => !a.rsvp_status)
  const staffRsvps = (staffRsvpListResult.data ?? []) as StaffRsvpRow[]
  const ownStaffRsvp = staffRsvps.find((row) => row.user_id === user.id) ?? null
  const otherStaffRsvps = staffRsvps.filter((row) => row.user_id !== user.id)
  const staffAttending = otherStaffRsvps.filter((row) => row.rsvp_status === 'attending')
  const staffDeclined = otherStaffRsvps.filter((row) => row.rsvp_status === 'declined')
  const staffMaybe = otherStaffRsvps.filter((row) => row.rsvp_status === 'maybe')
  const staffNoAnswer = otherStaffRsvps.filter((row) => !row.rsvp_status)
  const hasStaffRsvp = (staffRsvpExistenceRows?.length ?? 0) > 0
  const hasSubmittedRsvp =
    attendance.some((a) => a.rsvp_status !== null) || hasStaffRsvp
  const canHardDelete =
    !!canDelete &&
    !event.is_cancelled &&
    !hasStarted &&
    !attendanceError &&
    !staffRsvpExistenceError &&
    !hasSubmittedRsvp

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link
          href={`/teams/${teamId}/events`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zu Trainings
        </Link>
      </div>

      <PageHeader
        title={event.title}
        subtitle={team.name}
        action={
          event.is_cancelled ? (
            <Badge variant="danger">Abgesagt</Badge>
          ) : !!canEdit && !hasStarted ? (
            <Link
              href={`/teams/${teamId}/events/${eventId}/edit`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Bearbeiten
            </Link>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex gap-4">
                <dt className="w-24 flex-shrink-0 text-sm text-muted-foreground">Wann</dt>
                <dd className="text-sm text-foreground">{formatTrainingDateTime(event.starts_at)}</dd>
              </div>
              {event.location && (
                <div className="flex gap-4">
                  <dt className="w-24 flex-shrink-0 text-sm text-muted-foreground">Ort</dt>
                  <dd className="text-sm text-foreground">{event.location}</dd>
                </div>
              )}
              {event.description && (
                <div className="flex gap-4">
                  <dt className="w-24 flex-shrink-0 text-sm text-muted-foreground">Hinweise</dt>
                  <dd className="text-sm text-foreground whitespace-pre-line">{event.description}</dd>
                </div>
              )}
            </dl>
            {event.is_cancelled && (
              <p className="mt-4 text-sm font-medium text-danger">
                Dieses Training wurde abgesagt.
              </p>
            )}
          </CardContent>
        </Card>

        {!!canSeeStaffRsvp && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Trainer-Rückmeldungen
                </h2>
                {!staffRsvpListResult.error && otherStaffRsvps.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{staffAttending.length}</span>{' '}
                      Kommt
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{staffDeclined.length}</span>{' '}
                      Kommt nicht
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{staffMaybe.length}</span>{' '}
                      Vielleicht
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{staffNoAnswer.length}</span>{' '}
                      Keine Antwort
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <StaffRsvpForm
                eventId={eventId}
                currentStatus={ownStaffRsvp?.rsvp_status ?? null}
                currentNote={ownStaffRsvp?.rsvp_note ?? null}
                isCancelled={event.is_cancelled}
                hasStarted={hasStarted}
              />

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="mb-3 text-xs font-semibold text-foreground">Trainerteam</h3>
                {staffRsvpListResult.error ? (
                  <p className="text-sm text-muted-foreground">
                    Trainer-Rückmeldungen konnten nicht geladen werden.
                  </p>
                ) : otherStaffRsvps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine weiteren Trainer im Team.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {staffAttending.length > 0 && (
                      <StaffGroup label="Kommt" rows={staffAttending} />
                    )}
                    {staffDeclined.length > 0 && (
                      <StaffGroup label="Kommt nicht" rows={staffDeclined} />
                    )}
                    {staffMaybe.length > 0 && (
                      <StaffGroup label="Vielleicht" rows={staffMaybe} />
                    )}
                    {staffNoAnswer.length > 0 && (
                      <StaffGroup label="Noch keine Antwort" rows={staffNoAnswer} muted />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!!canCancel && !event.is_cancelled && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">Training absagen</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bestehende Rückmeldungen bleiben als Historie erhalten.
              </p>
              <div className="mt-4">
                <CancelEventButton eventId={eventId} />
              </div>
            </CardContent>
          </Card>
        )}

        {canHardDelete && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-danger">Training endgültig löschen</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Nur für irrtümlich angelegte Trainings. Diese Aktion entfernt den Termin
                unwiderruflich. Für ein nicht stattfindendes Training nutze stattdessen die Absage.
              </p>
              <DeleteTrainingForm eventId={eventId} />
            </CardContent>
          </Card>
        )}

        {isTrainer && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <h2 className="text-sm font-semibold text-foreground">Teilnehmer</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{attending.length}</span> Kommt
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{declined.length}</span> Kommt nicht
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{maybe.length}</span> Vielleicht
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{noAnswer.length}</span> Keine Antwort
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceError ? (
                <p className="text-sm text-muted-foreground">
                  Teilnehmerdaten konnten nicht geladen werden.
                </p>
              ) : attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Spieler im Team.</p>
              ) : (
                <div className="space-y-5">
                  {attending.length > 0 && <PlayerGroup label="Kommt" rows={attending} />}
                  {declined.length > 0 && <PlayerGroup label="Kommt nicht" rows={declined} />}
                  {maybe.length > 0 && <PlayerGroup label="Vielleicht" rows={maybe} />}
                  {noAnswer.length > 0 && (
                    <PlayerGroup label="Noch keine Antwort" rows={noAnswer} muted />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isTrainer && (
          <>
            {attendanceError ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Antwortdaten konnten nicht geladen werden. Bitte Seite neu laden.
                  </p>
                </CardContent>
              </Card>
            ) : attendance.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Kein Eintrag gefunden. Der Trainer muss dich zunächst zum Team hinzufügen.
                  </p>
                </CardContent>
              </Card>
            ) : (
              attendance.map((a) => (
                <Card key={a.id}>
                  <CardContent>
                    <RsvpForm
                      teamId={teamId}
                      eventId={eventId}
                      playerId={a.player_id}
                      playerName={
                        a.player
                          ? `${a.player.first_name} ${a.player.last_name}`
                          : 'Spieler'
                      }
                      currentStatus={a.rsvp_status}
                      currentNote={a.rsvp_note}
                      isCancelled={event.is_cancelled}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PlayerGroup({
  label,
  rows,
  muted = false,
}: {
  label: string
  rows: AttendanceWithPlayer[]
  muted?: boolean
}) {
  return (
    <div>
      <h3
        className={`mb-2 text-xs font-semibold ${muted ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {label}
      </h3>
      <ul className="space-y-1.5">
        {rows.map((a) => (
          <li key={a.id}>
            <p className="text-sm text-foreground">
              {a.player ? `${a.player.first_name} ${a.player.last_name}` : '—'}
            </p>
            {a.rsvp_note && (
              <p className="text-xs text-muted-foreground">{a.rsvp_note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StaffGroup({
  label,
  rows,
  muted = false,
}: {
  label: string
  rows: StaffRsvpRow[]
  muted?: boolean
}) {
  return (
    <div>
      <h4
        className={`mb-2 text-xs font-semibold ${muted ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {label}
      </h4>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.user_id}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-foreground">{row.full_name ?? 'Trainer'}</p>
              {!row.is_active_trainer && <Badge variant="outline">Nicht mehr aktiv</Badge>}
            </div>
            {row.rsvp_note && (
              <p className="text-xs text-muted-foreground">{row.rsvp_note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
