import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'

export default function UiPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
        <PageHeader
          title="Phase A — Komponenten-Vorschau"
          subtitle="Design-Fundament · Vereon V0.1"
          action={<Button size="sm">Neues Team</Button>}
        />

        {/* Buttons */}
        <Section label="Buttons">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button>Primär</Button>
            <Button variant="secondary">Sekundär</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Löschen</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button size="sm">Klein</Button>
            <Button size="md">Normal</Button>
            <Button size="lg">Groß</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button loading>Lädt …</Button>
            <Button disabled>Deaktiviert</Button>
          </div>
        </Section>

        {/* Badges */}
        <Section label="Badges">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Standard</Badge>
            <Badge variant="success">Angenommen</Badge>
            <Badge variant="warning">Ausstehend</Badge>
            <Badge variant="danger">Abgelehnt</Badge>
            <Badge variant="outline">Entwurf</Badge>
          </div>
        </Section>

        {/* Form */}
        <Section label="Formular-Elemente">
          <div className="grid max-w-sm gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name" required>Teamname</Label>
              <Input id="name" placeholder="z. B. U10 SK Musterstadt" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="year">Geburtsjahr</Label>
              <Input id="year" type="number" placeholder="2016" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="error-demo">Feld mit Fehler</Label>
              <Input
                id="error-demo"
                placeholder="Ungültiger Wert"
                error="Dieses Feld ist Pflicht."
              />
            </div>
          </div>
        </Section>

        {/* Form Error */}
        <Section label="Fehlermeldungen">
          <div className="grid max-w-sm gap-3">
            <FormError message="Der Einladungslink ist abgelaufen." />
            <FormError
              message={['Vorname darf nicht leer sein.', 'Geburtsjahr ist ungültig.']}
            />
          </div>
        </Section>

        {/* Cards */}
        <Section label="Cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    U10 SK Musterstadt
                  </h3>
                  <Badge variant="success">Aktiv</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">12 Spieler · 3 offene Anfragen</p>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button size="sm">Öffnen</Button>
                  <Button size="sm" variant="ghost">Einladen</Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    U14 SK Beispielstadt
                  </h3>
                  <Badge variant="warning">Ausstehend</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">7 Spieler · 1 offene Anfrage</p>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button size="sm">Öffnen</Button>
                  <Button size="sm" variant="ghost">Einladen</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* Empty State */}
        <Section label="Leerzustand">
          <EmptyState
            title="Noch keine Teams"
            description="Erstelle dein erstes eigenständiges Team und lade Spieler über einen Einladungslink ein."
            action={<Button>Team erstellen</Button>}
          />
        </Section>

        {/* Grenzfall-Tests */}
        <Section label="Grenzfall-Tests (lange Inhalte)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="break-words text-sm font-semibold text-foreground">
                    FC Blau-Weiß Stadtmannschaft 1923 Nachwuchs U12
                  </h3>
                  <Badge variant="success" className="flex-shrink-0">Aktiv</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  24 Spieler · Letzte Aktivität: vor 2 Tagen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>U12</Badge>
                  <Badge variant="outline">Herren</Badge>
                  <Badge variant="warning">3 Anfragen offen</Badge>
                  <Badge variant="danger">Link abgelaufen</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Öffnen</Button>
                  <Button size="sm" variant="secondary">Anfragen (3)</Button>
                  <Button size="sm" variant="ghost">Einladen</Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="break-words text-sm font-semibold text-foreground">
                    Jugendabteilung SK Muster-Regionalliga-Verein e.V.
                  </h3>
                  <Badge variant="danger" className="flex-shrink-0">Archiviert</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Spieler</dt>
                  <dd className="font-medium text-foreground">18</dd>
                  <dt className="text-muted-foreground">Saison</dt>
                  <dd className="font-medium text-foreground">2024/25</dd>
                  <dt className="text-muted-foreground">Erstellt</dt>
                  <dd className="font-medium text-foreground">14. März 2025</dd>
                </dl>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Reaktivieren</Button>
                  <Button size="sm" variant="ghost" className="text-danger">Löschen</Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <FormError message="Der Einladungslink ist ungültig oder bereits abgelaufen. Bitte fordere beim Trainer einen neuen Link an oder wende dich direkt an den Vereinsadministrator, um Zugang zu erhalten." />

          <div className="rounded-lg border border-border bg-surface p-4">
            <PageHeader
              title="Jugendbetreuer-Übersicht für die Saison 2024/25 — Alle Teams"
              subtitle="Letzter Stand: 26. Juni 2026 · 3 Teams aktiv"
              action={<Button size="sm" variant="secondary">Exportieren</Button>}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
