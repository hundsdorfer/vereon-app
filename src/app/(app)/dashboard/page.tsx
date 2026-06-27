import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { count: teamCount, error: countError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  if (countError) {
    console.error('Dashboard team count error', {
      message: countError.message,
      details: countError.details,
      hint: countError.hint,
      code: countError.code,
    })
  }

  function teamCountText() {
    if (countError) return 'Teams konnten nicht geladen werden.'
    if (teamCount === null || teamCount === 0) return 'Noch keine Teams erstellt.'
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
