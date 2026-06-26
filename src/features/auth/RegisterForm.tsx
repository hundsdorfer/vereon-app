'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpAction } from '@/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

type State = { error: string } | { success: true } | null

export function RegisterForm() {
  const [state, action, isPending] = useActionState<State, FormData>(signUpAction, null)

  if (state && 'success' in state) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
          <svg
            className="h-6 w-6 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-foreground">Bestätigungslink gesendet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte überprüfe deine E-Mails und klicke auf den Bestätigungslink.
          </p>
        </div>
        <Link href="/login" className="block text-sm font-medium text-primary hover:underline">
          Zurück zum Login
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state && 'error' in state && <FormError message={state.error} />}

      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="trainer@beispiel.at"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mindestens 8 Zeichen"
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Konto erstellen
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Bereits ein Konto?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  )
}
