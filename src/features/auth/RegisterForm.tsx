'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpAction, type SignUpState, type FormValues } from '@/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

const selectClass =
  'flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const EMPTY_VALUES: FormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  onboarding_role: '',
}

export function RegisterForm({ redirectPath }: { redirectPath?: string }) {
  const [state, action, isPending] = useActionState<SignUpState, FormData>(signUpAction, null)

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

  // Gespeicherte Werte aus Server-Response (bei Validierungsfehler)
  const saved = state && 'error' in state ? state.values : EMPTY_VALUES
  // Neuer Key bei jedem Fehler → Form neu mounten → defaultValue greift
  const formKey = state && 'error' in state ? state._key : 0

  return (
    <form key={formKey} action={action} className="space-y-4">
      {redirectPath && <input type="hidden" name="redirect" value={redirectPath} />}

      {state && 'error' in state && <FormError message={state.error} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" required>Vorname</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Max"
            defaultValue={saved.first_name}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name" required>Nachname</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Mustermann"
            defaultValue={saved.last_name}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" required>E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="max@beispiel.at"
          defaultValue={saved.email}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date_of_birth" required>Geburtsdatum</Label>
        <Input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          autoComplete="bday"
          required
          max={new Date().toISOString().split('T')[0]}
          defaultValue={saved.date_of_birth}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" required>Telefonnummer</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder="+43 664 1234567"
          defaultValue={saved.phone}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding_role" required>Ich nutze Vereon als …</Label>
        <select
          id="onboarding_role"
          name="onboarding_role"
          defaultValue={saved.onboarding_role}
          required
          className={selectClass}
        >
          <option value="" disabled>Bitte auswählen</option>
          <option value="player">Spieler/in</option>
          <option value="guardian">Elternteil / Erziehungsberechtigte/r</option>
          <option value="coach">Trainer/in</option>
          <option value="club_official">Vereinsfunktionär/in</option>
          <option value="other">Sonstiges</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" required>Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mindestens 8 Zeichen"
        />
        <p className="text-xs text-muted-foreground">
          Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="terms_accepted"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            Ich akzeptiere die{' '}
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Nutzungsbedingungen
            </Link>
            <span className="ml-1 text-danger" aria-hidden>*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="privacy_accepted"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            Ich akzeptiere die{' '}
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Datenschutzerklärung
            </Link>
            <span className="ml-1 text-danger" aria-hidden>*</span>
          </span>
        </label>
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Konto erstellen
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Bereits ein Konto?{' '}
        <Link
          href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
          className="font-medium text-primary hover:underline"
        >
          Anmelden
        </Link>
      </p>
    </form>
  )
}
