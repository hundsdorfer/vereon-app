import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { CreateTeamForm } from '@/features/teams/CreateTeamForm'

export default function NewTeamPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <h1 className="text-base font-semibold text-foreground">Neues Team erstellen</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Eigenständiges Team — kein Verein nötig.
          </p>
        </CardHeader>
        <CardContent>
          <CreateTeamForm />
        </CardContent>
      </Card>
    </div>
  )
}
