import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * Temporärer interner Zugangsschutz (HTTP Basic Auth) vor der bestehenden
 * Supabase-Anmeldung. Kein Ersatz für Supabase Auth/RLS, keine
 * Nutzerverwaltung. Wird vor dem Pilot entfernt oder durch eine geeignete
 * Plattformlösung ersetzt (vgl. docs/DECISION_LOG.md DEC-011).
 *
 * Benötigte Server-Umgebungsvariablen (niemals `NEXT_PUBLIC_`-Präfix):
 * - INTERNAL_ACCESS_ENABLED  ("true" schaltet den Schutz scharf)
 * - INTERNAL_ACCESS_USERNAME
 * - INTERNAL_ACCESS_PASSWORD
 */

const REALM = 'Vereon Internal Access'

export type InternalAccessResult =
  | { type: 'disabled' }
  | { type: 'authorized' }
  | { type: 'unauthorized' }

/** Zeitkonstanter String-Vergleich über fixlängige Digests, damit unterschiedliche Eingabelängen keinen frühen Abbruch verursachen. */
function safeEqual(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a, 'utf8').digest()
  const digestB = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(digestA, digestB)
}

function parseBasicAuth(header: string): { username: string; password: string } | null {
  const match = /^Basic\s+(.+)$/i.exec(header.trim())
  if (!match) return null

  let decoded: string
  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8')
  } catch {
    return null
  }

  const separatorIndex = decoded.indexOf(':')
  if (separatorIndex === -1) return null

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  }
}

/**
 * Wertet den internen Zugangsschutz aus. Fail-closed: Ist der Schutz aktiviert,
 * aber unvollständig konfiguriert, wird das Ergebnis 'unauthorized' —
 * nie 'disabled'.
 */
export function evaluateInternalAccess(headers: Headers): InternalAccessResult {
  if (process.env.INTERNAL_ACCESS_ENABLED !== 'true') {
    return { type: 'disabled' }
  }

  const expectedUsername = process.env.INTERNAL_ACCESS_USERNAME
  const expectedPassword = process.env.INTERNAL_ACCESS_PASSWORD
  if (!expectedUsername || !expectedPassword) {
    return { type: 'unauthorized' }
  }

  const authorizationHeader = headers.get('authorization')
  if (!authorizationHeader) {
    return { type: 'unauthorized' }
  }

  const credentials = parseBasicAuth(authorizationHeader)
  if (!credentials) {
    return { type: 'unauthorized' }
  }

  const usernameOk = safeEqual(credentials.username, expectedUsername)
  const passwordOk = safeEqual(credentials.password, expectedPassword)

  if (!usernameOk || !passwordOk) {
    return { type: 'unauthorized' }
  }

  return { type: 'authorized' }
}

/**
 * 401-Antwort ohne Hinweis auf die konkrete Fehlerursache. Nicht cachebar,
 * damit ein Proxy/Browser keine frühere Freigabe fälschlich wiederverwendet.
 */
export function internalAccessUnauthorizedResponse(): NextResponse {
  return new NextResponse(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

/**
 * Liefert eine bereinigte Kopie der Request-Header ohne Authorization-Header,
 * damit die Basic-Auth-Zugangsdaten nach erfolgreicher interner Prüfung nicht
 * an Server Components, Route Handler, Server Actions oder Logs weitergereicht
 * werden. Verändert nicht das ursprüngliche Request-/Headers-Objekt.
 */
export function stripAuthorizationHeader(headers: Headers): Headers {
  const sanitized = new Headers(headers)
  sanitized.delete('authorization')
  return sanitized
}
