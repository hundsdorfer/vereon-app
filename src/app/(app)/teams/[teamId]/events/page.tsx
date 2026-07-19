import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatTrainingDateTime } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

export default async function TeamEventsPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: team, error: teamError },
    { data: trainings, error: trainingsError },
    { data: isTrainer },
  ] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('events')
      .select('id, title, starts_at, location, is_cancelled')
      .eq('team_id', teamId)
      .eq('event_type', 'training')
      .order('starts_at', { ascending: false }),
    supabase.rpc('has_team_role', {
      p_team_id: teamId,
      p_role_keys: ['team_owner', 'head_coach', 'assistant_coach', 'team_manager'],
    }),
  ])

  if (teamError || !team) {
    if (teamError && teamError.code !== 'PGRST116') {
      console.error('Events page team query error', {
        message: teamError.message,
        code: teamError.code,
      })
    }
    notFound()
  }

  if (trainingsError) {
    console.error('Events page trainings query error', {
      message: trainingsError.message,
      code: trainingsError.code,
    })
  }

  const now = new Date().toISOString()
  const upcoming = (trainings ?? [])
    .filter((t) => t.starts_at >= now)
    .reverse()
  const past = (trainings ?? []).filter((t) => t.starts_at < now)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link
          href={`/teams/${teamId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Zurück zu {team.name}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Trainings" subtitle={team.name} />
        {!!isTrainer && (
          <div className="mt-1 flex-shrink-0">
            <Link
              href={`/teams/${teamId}/events/new`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
            >
              Training erstellen
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Kommende Trainings</h2>
          </CardHeader>
          <CardContent>
            {trainingsError ? (
              <p className="text-sm text-muted-foreground">
                Trainings konnten nicht geladen werden. Bitte Seite neu laden.
              </p>
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="Keine kommenden Trainings"
                description={
                  !!isTrainer
                    ? 'Erstelle ein Training, damit es hier erscheint.'
                    : 'Noch keine Trainings geplant.'
                }
                action={
                  !!isTrainer ? (
                    <Link
                      href={`/teams/${teamId}/events/new`}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
                    >
                      Training erstellen
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((training) => (
                  <li key={training.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/teams/${teamId}/events/${training.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {training.title}
                        {training.is_cancelled && <Badge variant="danger">Abgesagt</Badge>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTrainingDateTime(training.starts_at)}
                      </p>
                      {training.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{training.location}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {past.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">Vergangene Trainings</h2>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {past.map((training) => (
                  <li key={training.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/teams/${teamId}/events/${training.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {training.title}
                        {training.is_cancelled && <Badge variant="danger">Abgesagt</Badge>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTrainingDateTime(training.starts_at)}
                      </p>
                      {training.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{training.location}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
