'use client'

import { useActionState } from 'react'
import { createTeamAction } from '@/actions/team'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

type State = { error: string } | null

export function CreateTeamForm() {
  const [state, action, isPending] = useActionState<State, FormData>(createTeamAction, null)

  return (
    <form action={action} className="space-y-5">
      {state && 'error' in state && <FormError message={state.error} />}

      <div className="space-y-1.5">
        <Label htmlFor="team_name" required>Teamname</Label>
        <Input
          id="team_name"
          name="team_name"
          type="text"
          required
          placeholder="z. B. FC Musterstadt U12"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="age_group">Altersgruppe</Label>
        <Input
          id="age_group"
          name="age_group"
          type="text"
          placeholder="z. B. U12, Senioren"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gender">Geschlecht</Label>
        <select
          id="gender"
          name="gender"
          defaultValue=""
          className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Keine Angabe</option>
          <option value="mixed">Gemischt</option>
          <option value="male">Männlich</option>
          <option value="female">Weiblich</option>
        </select>
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Team erstellen
      </Button>
    </form>
  )
}
