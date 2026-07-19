import { test, expect } from '@playwright/test'
import { TRAINING_CANCEL_ROLES } from '../../src/lib/permissions'

// Statischer Rollenvertrags-Test: prüft NUR den Inhalt von TRAINING_CANCEL_ROLES,
// der Konstante, die produktiv in has_team_role()-RPC-Aufrufen verwendet wird
// (Event-Detailseite). Dies ist KEIN E2E-, Integrations- oder
// UI-Gating-Nachweis — die tatsächliche UI-Gating-Entscheidung erfolgt
// serverseitig über has_team_role() mit dieser Konstante, nicht über eine
// separate Funktion in diesem Modul.

test.describe('TRAINING_CANCEL_ROLES (statischer Rollenvertrag für Training absagen)', () => {
  test('enthält genau team_owner, head_coach, assistant_coach', () => {
    expect([...TRAINING_CANCEL_ROLES].sort()).toEqual(['assistant_coach', 'head_coach', 'team_owner'])
  })

  test('enthält NICHT team_manager', () => {
    expect(TRAINING_CANCEL_ROLES).not.toContain('team_manager')
  })
})
