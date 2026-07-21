import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { EditEventForm } from '@/features/events/EditEventForm'
import { TRAINING_EDIT_ROLES } from '@/lib/permissions'
import { utcToViennaLocal } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

export default async function EditEventPage({
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

  const [{ data: team }, { data: event }, { data: canEdit }] = await Promise.all([
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
      p_role_keys: TRAINING_EDIT_ROLES,
    }),
  ])

  // Fremdes/nicht existentes Team, nicht existentes Event, Nicht-Training-Event
  // oder fehlende Berechtigung -> notFound() (kein Rückschluss auf Existenz).
  if (!team || !event) notFound()
  if (event.event_type !== 'training') notFound()
  if (!canEdit) notFound()

  // Eigenes, aber abgesagtes oder bereits begonnenes Training -> zurück zur
  // Detailseite statt eines funktionslosen Formulars. Rein kosmetisches
  // Gating, die eigentliche Durchsetzung liegt in update_training().
  if (event.is_cancelled || new Date(event.starts_at) <= new Date()) {
    redirect(`/teams/${teamId}/events/${eventId}`)
  }

  const { count: rsvpCount, error: rsvpCountError } = await supabase
    .from('event_attendance')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('rsvp_status', 'is', null)

  if (rsvpCountError) {
    console.error('Edit page RSVP count query error', {
      message: rsvpCountError.message,
      code: rsvpCountError.code,
    })

    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-5">
          <Link
            href={`/teams/${teamId}/events/${eventId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zurück zum Training
          </Link>
        </div>

        <PageHeader
          title="Training bearbeiten"
          subtitle={team.name}
        />

        <div className="mt-6">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Die vorhandenen Rückmeldungen konnten derzeit nicht geprüft werden. Das
                Training kann deshalb momentan nicht bearbeitet werden.
              </p>
              <div className="mt-4">
                <Link
                  href={`/teams/${teamId}/events/${eventId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ← Zurück zum Training
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { date: initialDate, time: initialTime } = utcToViennaLocal(event.starts_at)

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5">
        <Link
          href={`/teams/${teamId}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zum Training
        </Link>
      </div>

      <PageHeader
        title="Training bearbeiten"
        subtitle={team.name}
      />

      <div className="mt-6">
        <Card>
          <CardContent>
            <EditEventForm
              eventId={eventId}
              initialTitle={event.title}
              initialDate={initialDate}
              initialTime={initialTime}
              initialLocation={event.location ?? ''}
              initialDescription={event.description ?? ''}
              rsvpCount={rsvpCount ?? 0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
