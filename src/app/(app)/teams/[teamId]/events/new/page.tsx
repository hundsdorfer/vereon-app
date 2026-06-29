import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { CreateEventForm } from '@/features/events/CreateEventForm'

export const dynamic = 'force-dynamic'

export default async function NewEventPage({
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
      console.error('New event page team query error', {
        message: teamError.message,
        code: teamError.code,
      })
    }
    notFound()
  }

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
        title="Training erstellen"
        subtitle={team.name}
      />

      <div className="mt-6">
        <Card>
          <CardContent>
            <CreateEventForm teamId={teamId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
