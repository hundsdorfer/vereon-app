import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

const GENDER_LABEL: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  mixed: 'Gemischt',
}

// Rollen, bei denen kein "Team erstellen"-CTA angezeigt wird
// (sofern der User auch keine aktive team_membership hat)
const NON_TRAINER_ROLES = ['player', 'guardian']

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: teams, error },
    { count: membershipCount },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, age_group, gender, ownership_type, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('team_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('onboarding_role')
      .eq('id', user.id)
      .single(),
  ])

  if (error) {
    console.error('Teams query error', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
  }

  const hasTrainerMembership = (membershipCount ?? 0) > 0
  const onboardingRole = profile?.onboarding_role ?? null
  const isNonTrainerProfile = onboardingRole !== null && NON_TRAINER_ROLES.includes(onboardingRole)
  // Zeige Trainer-UI wenn: bestehende Trainermitgliedschaft ODER kein eindeutiger Spieler-/Guardian-Hinweis
  const showTrainerUI = hasTrainerMembership || !isNonTrainerProfile

  const createLink = (
    <Link
      href="/teams/new"
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
    >
      Team erstellen
    </Link>
  )

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={showTrainerUI ? 'Meine Teams' : 'Deine Teams'}
        subtitle={showTrainerUI ? 'Eigenständige Teams verwalten' : undefined}
        action={showTrainerUI ? createLink : undefined}
      />

      <div className="mt-6">
        {error && (
          <div className="rounded-md border border-danger bg-surface-muted px-4 py-3">
            <p className="text-sm text-danger">
              Teams konnten nicht geladen werden. Bitte Seite neu laden.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fehlercode: {error.code ?? 'unbekannt'}
            </p>
          </div>
        )}

        {!error && teams && teams.length === 0 && (
          showTrainerUI ? (
            <EmptyState
              title="Noch keine Teams"
              description="Erstelle dein erstes eigenständiges Team — kein Verein nötig."
              action={createLink}
            />
          ) : (
            <EmptyState
              title="Noch kein Team"
              description="Sobald du einem Team beigetreten bist, erscheint es hier."
            />
          )
        )}

        {!error && teams && teams.length > 0 && (
          <ul className="space-y-3">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{team.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[
                        team.age_group,
                        team.gender ? GENDER_LABEL[team.gender] : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Keine weiteren Angaben'}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {team.ownership_type === 'independent' ? 'Eigenständig' : 'Vereinsteam'}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
