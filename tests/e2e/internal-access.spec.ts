import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient, type Session } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import {
  evaluateInternalAccess,
  internalAccessUnauthorizedResponse,
  stripAuthorizationHeader,
} from '@/lib/internal-access'
import {
  applySupabaseSessionState,
  updateSession,
} from '@/lib/supabase/middleware'

// .env.local wird von Next.js selbst geladen (dev/build), aber nicht von
// `npx playwright test` — für den P1-Regressionstest unten wird ein echter
// lokaler Supabase-Client benötigt.
loadEnvConfig(process.cwd())

// Reine Logiktests ohne laufenden Server: prüfen evaluateInternalAccess(),
// die 401-Antwort und die Header-Bereinigung isoliert. Ergänzend prüft
// tests/e2e/internal-access-enabled.spec.ts das Verhalten end-to-end gegen
// einen dedizierten, aktivierten Testserver.

function basicAuthHeader(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
}

function isLoopbackSupabaseUrl(value: string | undefined): boolean {
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

const ORIGINAL_ENV = { ...process.env }

test.afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key]
  }
  Object.assign(process.env, ORIGINAL_ENV)
})

test.describe('evaluateInternalAccess', () => {
  test('ohne INTERNAL_ACCESS_ENABLED → disabled (Default-/Bestandsverhalten)', () => {
    delete process.env.INTERNAL_ACCESS_ENABLED
    delete process.env.INTERNAL_ACCESS_USERNAME
    delete process.env.INTERNAL_ACCESS_PASSWORD

    const result = evaluateInternalAccess(new Headers())

    expect(result.type).toBe('disabled')
  })

  test('INTERNAL_ACCESS_ENABLED nicht exakt "true" → disabled', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'TRUE'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    const result = evaluateInternalAccess(new Headers())

    expect(result.type).toBe('disabled')
  })

  test('aktiviert, aber Username/Passwort fehlen → fail-closed unauthorized', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    delete process.env.INTERNAL_ACCESS_USERNAME
    delete process.env.INTERNAL_ACCESS_PASSWORD

    const headers = new Headers({
      authorization: basicAuthHeader('irgendwer', 'irgendwas'),
    })
    const result = evaluateInternalAccess(headers)

    expect(result.type).toBe('unauthorized')
  })

  test('aktiviert, kein Authorization-Header → unauthorized', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    const result = evaluateInternalAccess(new Headers())

    expect(result.type).toBe('unauthorized')
  })

  test('aktiviert, kaputter/ungewöhnlicher Authorization-Header → unauthorized statt Crash', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    for (const value of [
      'Bearer sometoken',
      'Basic',
      'Basic not-valid-base64!!!',
      'Basic ' + Buffer.from('kein-doppelpunkt', 'utf8').toString('base64'),
    ]) {
      const headers = new Headers({ authorization: value })
      expect(() => evaluateInternalAccess(headers)).not.toThrow()
      expect(evaluateInternalAccess(headers).type).toBe('unauthorized')
    }
  })

  test('aktiviert, falsche Zugangsdaten → unauthorized', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    const headers = new Headers({
      authorization: basicAuthHeader('test-user', 'falsches-passwort'),
    })
    const result = evaluateInternalAccess(headers)

    expect(result.type).toBe('unauthorized')
  })

  test('aktiviert, korrekte Zugangsdaten → authorized', () => {
    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    const headers = new Headers({
      authorization: basicAuthHeader('test-user', 'test-pass'),
    })
    const result = evaluateInternalAccess(headers)

    expect(result.type).toBe('authorized')
  })
})

test.describe('internalAccessUnauthorizedResponse', () => {
  test('liefert 401, WWW-Authenticate und Cache-Control ohne Fehlerursache', () => {
    const response = internalAccessUnauthorizedResponse()

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain('Basic')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})

test.describe('stripAuthorizationHeader', () => {
  test('entfernt ausschließlich den Authorization-Header, Original bleibt unverändert', () => {
    const headers = new Headers({
      authorization: basicAuthHeader('test-user', 'test-pass'),
      'x-custom-header': 'bleibt-erhalten',
    })

    const sanitized = stripAuthorizationHeader(headers)

    expect(sanitized.has('authorization')).toBe(false)
    expect(sanitized.get('x-custom-header')).toBe('bleibt-erhalten')
    expect(headers.has('authorization')).toBe(true)
  })
})

test.describe('lokale Supabase-Testgrenze', () => {
  test('erlaubt ausschließlich gültige Loopback-URLs', () => {
    expect(isLoopbackSupabaseUrl('http://localhost:54321')).toBe(true)
    expect(isLoopbackSupabaseUrl('http://127.0.0.1:54321')).toBe(true)
    expect(isLoopbackSupabaseUrl('http://[::1]:54321')).toBe(true)
    expect(isLoopbackSupabaseUrl('https://example.supabase.co')).toBe(false)
    expect(isLoopbackSupabaseUrl('http://localhost.example.com')).toBe(false)
    expect(isLoopbackSupabaseUrl('ftp://localhost')).toBe(false)
    expect(isLoopbackSupabaseUrl('keine-url')).toBe(false)
  })
})

test.describe('applySupabaseSessionState', () => {
  test('überträgt Session-Cookies und Supabase-Header auf Redirects', () => {
    const source = NextResponse.next()
    source.cookies.set('sb-test-session', 'refresh-cookie', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
    source.headers.set('x-middleware-override-headers', 'authorization,cookie')
    source.headers.set('x-middleware-request-authorization', 'Basic geheim')
    const responseHeaders = {
      'Cache-Control': 'private, no-cache, no-store',
      Expires: '0',
      Pragma: 'no-cache',
    }
    const redirect = applySupabaseSessionState(
      NextResponse.redirect('http://localhost:3000/dashboard'),
      source,
      responseHeaders
    )

    expect(redirect.cookies.get('sb-test-session')).toMatchObject({
      value: 'refresh-cookie',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
    expect(redirect.headers.get('cache-control')).toBe(responseHeaders['Cache-Control'])
    expect(redirect.headers.get('expires')).toBe(responseHeaders.Expires)
    expect(redirect.headers.get('pragma')).toBe(responseHeaders.Pragma)
    expect(redirect.headers.has('x-middleware-override-headers')).toBe(false)
    expect(redirect.headers.has('x-middleware-request-authorization')).toBe(false)
  })
})

test.describe('updateSession — Cookie-Refresh (P1-Regression)', () => {
  // Beweist den eigentlichen Fehler aus dem Codex-Review: Eine *vor* dem
  // Cookie-Refresh erzeugte Header-Kopie verdeckt das von Supabase in
  // setAll() gesetzte neue Session-Cookie. Ein Test, der nur
  // stripAuthorizationHeader() isoliert prüft, kann das nicht zeigen — hier
  // wird die echte updateSession() gegen ein echtes, lokales Supabase mit
  // einer real ablaufenden/erneuerbaren Session ausgeführt.
  test('setAll()-Cookie-Update wird weitergereicht, Authorization bleibt entfernt, Response erhält neuen Cookie', async () => {
    test.setTimeout(30_000)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    test.skip(
      !supabaseUrl || !supabaseAnonKey,
      'NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY nicht gesetzt — lokales Supabase erforderlich.'
    )
    test.skip(
      !isLoopbackSupabaseUrl(supabaseUrl),
      'Cookie-Refresh-Test läuft ausschließlich gegen eine Loopback-Supabase-URL.'
    )

    process.env.INTERNAL_ACCESS_ENABLED = 'true'
    process.env.INTERNAL_ACCESS_USERNAME = 'test-user'
    process.env.INTERNAL_ACCESS_PASSWORD = 'test-pass'

    // 1. Einen festen, ausschließlich lokalen Testnutzer anlegen oder
    //    wiederverwenden. So wächst die lokale Auth-Tabelle nicht bei jedem
    //    Testlauf um einen weiteren Account.
    const email = 'internal-access-cookie-refresh@vereon.test'
    const password = 'Test1234!'
    const plainClient = createClient(supabaseUrl!, supabaseAnonKey!)
    const { data: signInData } =
      await plainClient.auth.signInWithPassword({ email, password })
    let realSession = signInData.session as Session | null
    if (!realSession) {
      const { data: signUpData, error: signUpError } =
        await plainClient.auth.signUp({ email, password })
      expect(signUpError).toBeNull()
      realSession = signUpData.session
    }
    expect(realSession).not.toBeNull()

    // 2. Eine Wegwerf-Instanz von @supabase/ssr "schreibt" die echte Session
    //    einmal in einen In-Memory-Cookie-Speicher — dadurch entsteht der
    //    reale, korrekt kodierte/benannte Cookie, ohne das Format hier
    //    nachzubauen oder anzunehmen.
    const writerCookies = new Map<string, string>()
    const writerClient = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll: () => [...writerCookies.entries()].map(([name, value]) => ({ name, value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => writerCookies.set(name, value))
        },
      },
    })
    await writerClient.auth.setSession({
      access_token: realSession!.access_token,
      refresh_token: realSession!.refresh_token,
    })
    expect(writerCookies.size).toBeGreaterThan(0)

    // 3. Jeden erfassten Chunk auf einen Zeitpunkt in der Vergangenheit
    //    zurückdatieren (nur `expires_at`), damit Supabase beim nächsten
    //    getUser() serverseitig über den echten refresh_token auffrischt.
    const BASE64_PREFIX = 'base64-'
    const staleCookiePairs: string[] = []
    for (const [name, value] of writerCookies) {
      expect(value.startsWith(BASE64_PREFIX)).toBe(true)
      const decoded = Buffer.from(value.slice(BASE64_PREFIX.length), 'base64url').toString('utf8')
      const parsed = JSON.parse(decoded)
      parsed.expires_at = Math.floor(Date.now() / 1000) - 3600
      const reEncoded =
        BASE64_PREFIX + Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url')
      staleCookiePairs.push(`${name}=${reEncoded}`)
    }
    const staleCookieHeader = staleCookiePairs.join('; ')

    // 4. Request mit abgelaufenem Supabase-Session-Cookie UND aktiviertem,
    //    korrektem internem Zugangsschutz bauen.
    const validInternalAuth =
      'Basic ' + Buffer.from('test-user:test-pass', 'utf8').toString('base64')
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: staleCookieHeader,
        authorization: validInternalAuth,
      },
    })

    // 5. Die echte, produktive updateSession() ausführen.
    const { supabaseResponse, user } = await updateSession(request, true)

    // 6. Refresh hat stattgefunden und einen gültigen Nutzer geliefert.
    expect(user).not.toBeNull()
    expect(user?.email).toBe(email)

    // 7. Der an nachgelagerte Server Components/Route Handler weitergereichte
    // Request (kodiert von NextResponse.next({request:{headers}}) als
    // x-middleware-request-*-Header, siehe next/dist/server/web/spec-extension/response.js)
    // enthält den NEUEN Cookie, nicht den abgelaufenen von Schritt 4.
    const forwardedCookieHeader = supabaseResponse.headers.get('x-middleware-request-cookie')
    expect(forwardedCookieHeader).not.toBeNull()
    expect(forwardedCookieHeader).not.toBe(staleCookieHeader)
    for (const name of writerCookies.keys()) {
      expect(forwardedCookieHeader).toContain(`${name}=`)
    }
    expect(forwardedCookieHeader).not.toContain(staleCookiePairs[0])

    // 8. Der interne Basic-Auth-Header bleibt weiterhin entfernt.
    expect(supabaseResponse.headers.get('x-middleware-request-authorization')).toBeNull()
    const overrideHeaderNames = supabaseResponse.headers.get('x-middleware-override-headers')
    expect(overrideHeaderNames).not.toBeNull()
    expect(overrideHeaderNames!.split(',')).not.toContain('authorization')
    expect(overrideHeaderNames!.split(',')).toContain('cookie')

    // 9. Der Response an den Browser enthält den aktualisierten Cookie
    // (Set-Cookie), damit der Client die neue Session übernimmt.
    const setCookieNames = supabaseResponse.cookies.getAll().map((c) => c.name)
    for (const name of writerCookies.keys()) {
      expect(setCookieNames).toContain(name)
    }

    // 10. @supabase/ssr liefert bei Auth-Cookie-Updates Cache-Schutz-Header,
    // die unverändert auf die Response übernommen werden müssen.
    expect(supabaseResponse.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0'
    )
    expect(supabaseResponse.headers.get('expires')).toBe('0')
    expect(supabaseResponse.headers.get('pragma')).toBe('no-cache')
  })
})
