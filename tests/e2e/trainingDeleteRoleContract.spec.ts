import { expect, test } from '@playwright/test'
import { TRAINING_DELETE_ROLES } from '../../src/lib/permissions'

test.describe('TRAINING_DELETE_ROLES (statischer Rollenvertrag)', () => {
  test('enthält ausschließlich team_owner und head_coach', () => {
    expect([...TRAINING_DELETE_ROLES].sort()).toEqual(['head_coach', 'team_owner'])
    expect(TRAINING_DELETE_ROLES).not.toContain('assistant_coach')
    expect(TRAINING_DELETE_ROLES).not.toContain('team_manager')
  })
})
