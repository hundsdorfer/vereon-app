import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Prüft, ob eine Supabase-URL ausschließlich auf einen lokalen
 * Loopback-Host (localhost/127.0.0.1/::1) zeigt. Reine Logik ohne
 * Datei-/Env-Zugriff — Grundlage für die Sicherheitsgrenze, dass
 * E2E-Tests, die echte Nutzer/Daten über den Browser anlegen, niemals
 * versehentlich gegen eine Cloud-Supabase-Instanz laufen.
 */
export function isLoopbackSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
      url.hostname.toLowerCase()
    )
  } catch {
    return false
  }
}

/**
 * Reine Prüf-/Validierungsfunktion ohne jeglichen Datei- oder
 * Prozess-Env-Zugriff: nimmt URL und Anon-Key als Parameter entgegen und
 * wirft, wenn die URL keine gültige Loopback-Supabase-URL ist oder der
 * Anon-Key fehlt. Dadurch bleiben Tests für diese Fälle unabhängig von der
 * tatsächlich auf diesem Rechner vorhandenen `.env.local` — sie können
 * synthetische Werte direkt übergeben.
 *
 * Die Fehlermeldungen enthalten niemals den (potenziell secret-artigen)
 * anonKey-Wert.
 */
export function assertLoopbackSupabaseEnv(
  url: string | undefined,
  anonKey: string | undefined
): { url: string; anonKey: string } {
  if (!isLoopbackSupabaseUrl(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL zeigt nicht auf eine lokale Loopback-Adresse (localhost/127.0.0.1/::1): ${url ?? 'undefined'}. ` +
        'Dieser E2E-Test registriert echte Nutzer und legt echte Daten an und darf ausschließlich gegen eine lokale Supabase-Instanz laufen.'
    )
  }

  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt oder ist leer. Ohne Anon-Key kann kein Supabase-Client für diesen E2E-Test erzeugt werden.'
    )
  }

  return { url, anonKey }
}

/**
 * Liest die öffentlichen Supabase-Zugangsdaten (URL + Anon/Publishable
 * Key). Bevorzugt process.env, fällt sonst auf einen direkten Read von
 * .env.local zurück — dabei werden AUSSCHLIESSLICH die beiden
 * NEXT_PUBLIC_*-Werte extrahiert (identisch zu dem, was next dev ohnehin
 * in jedes Client-Bundle einbettet). SUPABASE_SERVICE_ROLE_KEY oder andere
 * Secrets werden hier nie gelesen oder ausgegeben.
 *
 * Validiert anschließend über assertLoopbackSupabaseEnv(), dass die URL
 * auf eine lokale Loopback-Adresse zeigt — wirft andernfalls sofort.
 */
export function getLoopbackSupabaseEnv(): { url: string; anonKey: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // process.cwd() statt einer __dirname-relativen Konstruktion: `npx
    // playwright test` wird immer aus dem Repo-Root heraus aufgerufen,
    // während __dirname vom tatsächlichen Speicherort dieser Datei
    // (tests/e2e/helpers/) abhinge und bei Verschiebungen leicht falsch
    // auf das Repo-Root auflösen würde.
    const envPath = resolve(process.cwd(), '.env.local')
    const content = readFileSync(envPath, 'utf-8')
    url = url ?? content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim()
    anonKey =
      anonKey ?? content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim()
  }

  return assertLoopbackSupabaseEnv(url, anonKey)
}
