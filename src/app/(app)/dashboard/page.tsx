import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
            <p className="mt-1 text-sm text-muted-foreground">
              Eigenständige Teams erstellen und Spieler einladen — folgt in Phase C.
            </p>
          </div>
          <Badge variant="outline" className="flex-shrink-0">Kommt als Nächstes</Badge>
        </div>
      </div>
    </div>
  )
}
