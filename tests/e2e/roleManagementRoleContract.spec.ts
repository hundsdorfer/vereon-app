import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { ROLE_MANAGEMENT_ROLES } from '../../src/lib/permissions'

function migrationSql(): string {
  return readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260723100000_add_role_management.sql'),
    'utf8',
  )
}

function functionSql(name: string): string {
  return (
    migrationSql()
      .split(`CREATE OR REPLACE FUNCTION public.${name}`)[1]
      ?.split(`REVOKE EXECUTE ON FUNCTION public.${name}`)[0] ?? ''
  )
}

test.describe('ROLE_MANAGEMENT_ROLES (statischer Rollenvertrag)', () => {
  test('enthält ausschließlich team_owner', () => {
    expect([...ROLE_MANAGEMENT_ROLES]).toEqual(['team_owner'])
  })

  test('enthält NICHT head_coach, assistant_coach oder team_manager', () => {
    expect(ROLE_MANAGEMENT_ROLES).not.toContain('head_coach')
    expect(ROLE_MANAGEMENT_ROLES).not.toContain('assistant_coach')
    expect(ROLE_MANAGEMENT_ROLES).not.toContain('team_manager')
  })

  test('grant_assistant_coach() prüft ausschließlich team_owner als Berechtigung', () => {
    const fn = functionSql('grant_assistant_coach')

    expect(fn).toBeTruthy()
    expect(fn).toContain("has_team_role(p_team_id, 'team_owner')")
    expect(fn).not.toContain("has_team_role(p_team_id, 'team_owner', 'head_coach'")
  })

  test('revoke_assistant_coach() prüft ausschließlich team_owner als Berechtigung', () => {
    const fn = functionSql('revoke_assistant_coach')

    expect(fn).toBeTruthy()
    expect(fn).toContain("has_team_role(p_team_id, 'team_owner')")
    expect(fn).not.toContain("has_team_role(p_team_id, 'team_owner', 'head_coach'")
  })

  test('list_assistant_coaches() prüft ausschließlich team_owner als Berechtigung', () => {
    const fn = functionSql('list_assistant_coaches')

    expect(fn).toBeTruthy()
    expect(fn).toContain("has_team_role(p_team_id, 'team_owner')")
    expect(fn).not.toContain("has_team_role(p_team_id, 'team_owner', 'head_coach'")
  })

  test('grant_assistant_coach() und revoke_assistant_coach() verweigern Self-Targeting serverseitig', () => {
    const grant = functionSql('grant_assistant_coach')
    const revoke = functionSql('revoke_assistant_coach')

    expect(grant).toContain('p_target_user_id = auth.uid()')
    expect(revoke).toContain('p_target_user_id = auth.uid()')
  })

  test('grant_assistant_coach() legt team_memberships nie per UPDATE reaktivierend an', () => {
    const fn = functionSql('grant_assistant_coach')

    expect(fn).toContain('ON CONFLICT (team_id, user_id) DO NOTHING')
    expect(fn).not.toContain('DO UPDATE SET status')
  })

  test('revoke_assistant_coach() deaktiviert die Mitgliedschaft, sobald keine Rolle mehr verbleibt', () => {
    const fn = functionSql('revoke_assistant_coach')

    expect(fn).toContain("SET status = 'inactive'")
  })

  test('alle drei Funktionen entziehen PUBLIC/anon EXECUTE und gewähren es nur authenticated', () => {
    const sql = migrationSql()

    for (const fn of ['grant_assistant_coach', 'revoke_assistant_coach', 'list_assistant_coaches']) {
      const argSuffix = fn === 'list_assistant_coaches' ? 'uuid' : 'uuid, uuid'
      expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION public.${fn}(${argSuffix}) FROM PUBLIC`)
      expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION public.${fn}(${argSuffix}) FROM anon`)
      expect(sql).toContain(`GRANT  EXECUTE ON FUNCTION public.${fn}(${argSuffix}) TO authenticated`)
    }
  })

  test('team_role_audit_log erhält keine INSERT/UPDATE/DELETE-Grants für authenticated', () => {
    const sql = migrationSql()
    const tableBlock =
      sql.split('CREATE TABLE public.team_role_audit_log')[1]?.split('CREATE OR REPLACE FUNCTION')[0] ?? ''

    expect(tableBlock).toContain('GRANT SELECT ON public.team_role_audit_log TO authenticated')
    expect(tableBlock).not.toContain('GRANT INSERT')
    expect(tableBlock).not.toContain('GRANT UPDATE')
    expect(tableBlock).not.toContain('GRANT DELETE')
  })

  test('team_role_audit_log verliert Historie nicht per CASCADE bei Account-Löschung', () => {
    const sql = migrationSql()
    const tableBlock =
      sql.split('CREATE TABLE public.team_role_audit_log')[1]?.split('ALTER TABLE public.team_role_audit_log')[0] ?? ''

    expect(tableBlock).toContain('target_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL')
    expect(tableBlock).toContain('performed_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL')
  })
})
