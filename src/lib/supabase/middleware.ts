import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { stripAuthorizationHeader } from '@/lib/internal-access'

type SupabaseResponseHeaders = Record<string, string>

function applyResponseHeaders(
  response: NextResponse,
  headers: SupabaseResponseHeaders
) {
  Object.entries(headers).forEach(([name, value]) =>
    response.headers.set(name, value)
  )
}

/**
 * Überträgt ausschließlich die von Supabase gesetzten Session-Cookies und
 * Cache-Schutz-Header auf eine nachgelagerte Response, z.B. einen Redirect.
 * Interne Next.js-Weiterleitungsheader (`x-middleware-*`) werden bewusst nicht
 * kopiert.
 */
export function applySupabaseSessionState(
  targetResponse: NextResponse,
  sourceResponse: NextResponse,
  responseHeaders: SupabaseResponseHeaders
) {
  sourceResponse.cookies.getAll().forEach((cookie) =>
    targetResponse.cookies.set(cookie)
  )
  applyResponseHeaders(targetResponse, responseHeaders)
  return targetResponse
}

/**
 * @param request Ursprünglicher Request — bleibt allein maßgeblich für Cookies/Session.
 * @param stripAuthorization Wenn `true`, wird der interne Basic-Auth-Header aus den
 *   Headern entfernt, die an nachgelagerte Server Components/Route Handler
 *   weitergereicht werden. Die Header werden bei jedem `NextResponse.next()`-Aufruf
 *   frisch aus dem *aktuellen* `request.headers` gebaut (nicht einmalig zwischengespeichert),
 *   damit ein Cookie-Update aus `setAll()` (Supabase mutiert `request.cookies` in-place)
 *   nicht durch eine veraltete Header-Kopie verdeckt wird.
 */
export async function updateSession(request: NextRequest, stripAuthorization = false) {
  const buildForwardedHeaders = () =>
    stripAuthorization ? stripAuthorizationHeader(request.headers) : request.headers

  let responseHeaders: SupabaseResponseHeaders = {}
  let supabaseResponse = NextResponse.next({ request: { headers: buildForwardedHeaders() } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // request.cookies.set() mutiert request.headers (Cookie-Header) in-place.
          // Header hier erneut aus dem jetzt aktualisierten request.headers bauen,
          // statt eine vor der Mutation erzeugte Kopie wiederzuverwenden.
          supabaseResponse = NextResponse.next({ request: { headers: buildForwardedHeaders() } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          responseHeaders = { ...headersToSet }
          applyResponseHeaders(supabaseResponse, responseHeaders)
        },
      },
    }
  )

  // Always use getUser() to validate the JWT server-side.
  // getSession() trusts the local cookie without server verification — never use it here.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, supabaseResponse, responseHeaders, user }
}
