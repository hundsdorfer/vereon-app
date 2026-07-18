import { type NextRequest, NextResponse } from 'next/server'
import {
  applySupabaseSessionState,
  updateSession,
} from '@/lib/supabase/middleware'
import {
  evaluateInternalAccess,
  internalAccessUnauthorizedResponse,
  stripAuthorizationHeader,
} from '@/lib/internal-access'

// Routen, die ohne Login zugänglich sind
const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/auth/callback'])
// Pfad-Präfixe, die ohne Login zugänglich sind
const PUBLIC_PREFIXES = [
  '/join/',
  '/legal/',
  ...(process.env.NODE_ENV === 'development' ? ['/dev/'] : []),
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  // Temporärer interner Zugangsschutz — muss vor jedem weiteren Verhalten
  // greifen, auch vor dem Rücksprung bei fehlender Supabase-Konfiguration,
  // damit eine unvollständige Supabase-Konfiguration den aktivierten Schutz
  // nicht umgehen kann. Siehe docs/DECISION_LOG.md DEC-011.
  const internalAccess = evaluateInternalAccess(request.headers)
  if (internalAccess.type === 'unauthorized') {
    return internalAccessUnauthorizedResponse()
  }
  // Nach erfolgreicher interner Prüfung wird der Basic-Auth-Header nicht an
  // Server Components/Route Handler/Server Actions weitergereicht. Als
  // Flag statt vorab erzeugter Header-Kopie durchgereicht, damit
  // updateSession() die Header bei jedem Response-Aufbau frisch aus dem
  // dann aktuellen request.headers bauen kann (siehe dortiger Kommentar).
  const stripAuthorization = internalAccess.type === 'authorized'

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const headers = stripAuthorization ? stripAuthorizationHeader(request.headers) : request.headers
    return NextResponse.next({ request: { headers } })
  }

  const { supabaseResponse, responseHeaders, user } = await updateSession(
    request,
    stripAuthorization
  )
  const pathname = request.nextUrl.pathname

  // Nicht eingeloggt → geschützte Route → /login mit redirect-Param
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return applySupabaseSessionState(
      NextResponse.redirect(url),
      supabaseResponse,
      responseHeaders
    )
  }

  // Eingeloggt → Auth-Seiten → /dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return applySupabaseSessionState(
      NextResponse.redirect(url),
      supabaseResponse,
      responseHeaders
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
