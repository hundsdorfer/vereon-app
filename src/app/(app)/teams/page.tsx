import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Meine Teams"
        subtitle="Eigenständige Teams verwalten"
        action={<Badge variant="warning">Kommt in Phase C</Badge>}
      />
      <EmptyState
        title="Noch keine Teams"
        description="Du hast noch keine eigenständigen Teams erstellt. Team-Erstellung wird in Phase C verfügbar — dann kannst du hier ein Team anlegen und Spieler über einen Einladungslink einladen."
        action={<Button disabled>Team erstellen</Button>}
      />
    </div>
  )
}
