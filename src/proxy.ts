import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Public routes — accessible without authentication.
// Protected route enforcement is added during the auth implementation step.
//
// Public:  '/', '/login', '/register', '/auth/callback', '/invite/*'
// Static:  excluded via matcher below

export async function proxy(request: NextRequest) {
  // Skip session refresh when Supabase is not yet configured (before .env.local is set up).
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse } = await updateSession(request)
  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
