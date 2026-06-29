import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

const NON_TRAINER_ROLES = ['player', 'guardian']

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: teamCount, error: countError },
    { count: membershipCount },
    { data: profile },
  ] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('team_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '')
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('onboarding_role')
      .eq('id', user?.id ?? '')
      .single(),
  ])

  if (countError) {
    console.error('Dashboard team count error', {
      message: countError.message,
      details: countError.details,
      hint: countError.hint,
      code: countError.code,
    })
  }

  const hasTrainerMembership = (membershipCount ?? 0) > 0
  const onboardingRole = profile?.onboarding_role ?? null
  const isNonTrainerProfile = onboardingRole !== null && NON_TRAINER_ROLES.includes(onboardingRole)
  const showTrainerUI = hasTrainerMembership || !isNonTrainerProfile

  function teamCountText() {
    if (countError) return 'Teams konnten nicht geladen werden.'
    if (teamCount === null || teamCount === 0) {
      return showTrainerUI
        ? 'Noch keine Teams erstellt.'
        : 'Du bist noch keinem Team zugeordnet.'
    }
    return `${teamCount} ${teamCount === 1 ? 'Team' : 'Teams'}`
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        subtitle={user?.email ?? ''}
      />

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Meine Teams</h2>
            <p className={`mt-1 text-sm ${countError ? 'text-danger' : 'text-muted-foreground'}`}>
              {teamCountText()}
            </p>
          </div>
          <Link
            href="/teams"
            className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Alle Teams →
          </Link>
        </div>
      </div>
    </div>
  )
}
