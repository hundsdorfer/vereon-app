import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/actions/auth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        subtitle={user?.email ?? ''}
        action={
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              Abmelden
            </Button>
          </form>
        }
      />
      <p className="text-sm text-muted-foreground">
        Team-Features folgen in Phase B.2.
      </p>
    </div>
  )
}
