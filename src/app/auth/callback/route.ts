import { createClient } from '@/lib/supabase/route-handler'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')

  if (code) {
    const { supabase, response } = createClient(request)
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/dashboard', request.url), {
      headers: response.headers,
    })
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
