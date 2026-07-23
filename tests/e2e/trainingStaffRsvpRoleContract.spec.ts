import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { TRAINING_STAFF_RSVP_ROLES } from '../../src/lib/permissions'

function listFunctionSql(): string {
  const migration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260722090000_add_staff_rsvp.sql'),
    'utf8',
  )
  return (
    migration
      .split('CREATE OR REPLACE FUNCTION public.list_staff_rsvps_for_event')[1]
      ?.split('REVOKE EXECUTE ON FUNCTION public.list_staff_rsvps_for_event')[0] ?? ''
  )
}

test.describe('TRAINING_STAFF_RSVP_ROLES (statischer Rollenvertrag)', () => {
  test('enthält genau team_owner, head_coach und assistant_coach', () => {
    expect([...TRAINING_STAFF_RSVP_ROLES].sort()).toEqual([
      'assistant_coach',
      'head_coach',
      'team_owner',
    ])
  })

  test('enthält NICHT team_manager', () => {
    expect(TRAINING_STAFF_RSVP_ROLES).not.toContain('team_manager')
  })

  test('die Listen-RPC berücksichtigt in beiden Zweigen nur die drei Trainerrollen', () => {
    const listFunction = listFunctionSql()

    expect(listFunction).toBeTruthy()
    expect(listFunction).toContain(
      "r.key IN ('team_owner', 'head_coach', 'assistant_coach')",
    )
    expect(listFunction).toContain(
      "r2.key IN ('team_owner', 'head_coach', 'assistant_coach')",
    )
    expect(listFunction).not.toContain('team_manager')
  })

  test('die Listen-RPC liefert Namen als SECURITY DEFINER ohne Fremd-SELECT auf profiles', () => {
    const listFunction = listFunctionSql()

    expect(listFunction).toContain('SECURITY DEFINER')
    expect(listFunction).toContain('LEFT JOIN public.profiles p ON p.id = combined.user_id')
    expect(listFunction).toContain('p.full_name')
  })

  test('die Listen-RPC erhält historische Antworten und markiert aktive Trainer', () => {
    const listFunction = listFunctionSql()

    expect(listFunction).toContain('true AS is_active_trainer')
    expect(listFunction).toContain('false AS is_active_trainer')
    expect(listFunction).toContain('LEFT JOIN public.event_staff_rsvps esr')
    expect(listFunction).toContain('AND NOT EXISTS (')
  })
})
