import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Nicht eingeloggt → geschützte Route → /login mit redirect-Param
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Eingeloggt → Auth-Seiten → /dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
