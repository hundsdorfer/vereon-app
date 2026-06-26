'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type SignInState = { error: string } | null
type SignUpState = { error: string } | { success: true } | null

function safeRedirectPath(path: string | null): string {
  if (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('/login') &&
    !path.startsWith('/register') &&
    !path.startsWith('/auth')
  ) {
    return path
  }
  return '/dashboard'
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectPath = formData.get('redirect') as string | null

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-Mail oder Passwort ist ungültig.' }
  }

  redirect(safeRedirectPath(redirectPath))
}

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    if (msg.includes('password')) {
      return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  if (data.session) {
    // Lokale Supabase-Instanz: enable_confirmations = false → sofortiger Login
    redirect('/dashboard')
  }

  // Produktion: E-Mail-Bestätigung erforderlich
  return { success: true }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
