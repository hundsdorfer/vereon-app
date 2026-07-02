import Link from 'next/link'

export const metadata = {
  title: 'Impressum — Vereon',
}

export default function ImprintPage() {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-surface px-5 py-4">
        <Link href="/" className="text-lg font-bold text-foreground hover:opacity-80">
          Vereon
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="mb-8">
          <div className="inline-block rounded-md border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            PLATZHALTER — Finaler Rechtstext muss vor Veröffentlichung eingefügt werden
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">Impressum</h1>
        <p className="mb-8 text-sm text-muted-foreground">Stand: 2026-07-02</p>

        <div className="space-y-6 text-sm text-foreground">
          <p className="text-muted-foreground">
            Diese Seite enthält noch keinen finalen Rechtstext. Die Offenlegungsangaben für Vereon
            werden vor dem öffentlichen Pilotbetrieb ergänzt und hier veröffentlicht.
          </p>

          <section>
            <h2 className="mb-2 text-base font-semibold">1. Betreiber / Medieninhaber</h2>
            <p className="text-muted-foreground">[Platzhalter — wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. Anschrift</h2>
            <p className="text-muted-foreground">[Platzhalter — wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. Kontakt</h2>
            <p className="text-muted-foreground">[Platzhalter — wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. Unternehmensform / Firmenbuch / Gewerbe / UID</h2>
            <p className="text-muted-foreground">[Platzhalter — falls zutreffend, wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. Vertretungsberechtigte Person</h2>
            <p className="text-muted-foreground">[Platzhalter — falls zutreffend, wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. Aufsichtsbehörde</h2>
            <p className="text-muted-foreground">[Platzhalter — falls zutreffend, wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. Offenlegung</h2>
            <p className="text-muted-foreground">[Platzhalter — wird ergänzt]</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">8. Haftungshinweis</h2>
            <p className="text-muted-foreground">[Platzhalter — wird ergänzt]</p>
          </section>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Link href="/register" className="text-sm text-primary hover:underline">
            ← Zurück zur Registrierung
          </Link>
        </div>
      </main>
    </div>
  )
}
