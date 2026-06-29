'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signInAction } from '@/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

type State = { error: string } | null

export function LoginForm({ redirectPath }: { redirectPath?: string }) {
  const [state, action, isPending] = useActionState<State, FormData>(signInAction, null)

  return (
    <form action={action} className="space-y-4">
      {redirectPath && <input type="hidden" name="redirect" value={redirectPath} />}

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
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Anmelden
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{' '}
        <Link
          href={redirectPath ? `/register?redirect=${encodeURIComponent(redirectPath)}` : '/register'}
          className="font-medium text-primary hover:underline"
        >
          Registrieren
        </Link>
      </p>
    </form>
  )
}
