import { test, expect } from '@playwright/test'
import { TRAINING_EDIT_ROLES } from '../../src/lib/permissions'

// Statischer Rollenvertrags-Test: prüft NUR den Inhalt von TRAINING_EDIT_ROLES,
// der Konstante, die produktiv in has_team_role()-RPC-Aufrufen verwendet wird
// (Event-Detail- und Bearbeiten-Seite). Dies ist KEIN E2E-, Integrations-
// oder UI-Gating-Nachweis — die tatsächliche Autorisierung erfolgt
// serverseitig in update_training() (supabase/migrations/20260721094219_update_training.sql),
// nicht über diese Konstante allein. Ersetzt insbesondere NICHT die fehlende
// End-to-End-Verifikation für head_coach-only und assistant_coach-only
// (siehe core-flow-edit-training.spec.ts, Kommentarblock am Dateianfang).

test.describe('TRAINING_EDIT_ROLES (statischer Rollenvertrag für Training bearbeiten)', () => {
  test('enthält genau team_owner, head_coach, assistant_coach', () => {
    expect([...TRAINING_EDIT_ROLES].sort()).toEqual(['assistant_coach', 'head_coach', 'team_owner'])
  })

  test('enthält NICHT team_manager', () => {
    expect(TRAINING_EDIT_ROLES).not.toContain('team_manager')
  })
})
