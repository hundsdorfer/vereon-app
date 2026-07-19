import { test, expect } from '@playwright/test'
import {
  isLoopbackSupabaseUrl,
  assertLoopbackSupabaseEnv,
  getLoopbackSupabaseEnv,
} from './supabaseTestGuard'

// Reine Tests ohne Browser. assertLoopbackSupabaseEnv() ist bewusst so
// gebaut, dass sie NIEMALS process.env oder das Dateisystem berührt —
// deshalb sind diese Tests unabhängig von der tatsächlich auf diesem
// Rechner vorhandenen .env.local und laufen auf jeder Maschine identisch.

test.describe('isLoopbackSupabaseUrl', () => {
  test('Smoke-Test: Loopback-URL true, Cloud-URL false', () => {
    expect(isLoopbackSupabaseUrl('http://localhost:54321')).toBe(true)
    expect(isLoopbackSupabaseUrl('https://example.supabase.co')).toBe(false)
  })
})

test.describe('assertLoopbackSupabaseEnv', () => {
  test('wirft bei Cloud-URL', () => {
    expect(() =>
      assertLoopbackSupabaseEnv('https://xyz.supabase.co', 'key')
    ).toThrow()
  })

  test('wirft bei fehlender URL', () => {
    expect(() => assertLoopbackSupabaseEnv(undefined, 'key')).toThrow()
  })

  test('wirft bei fehlendem Anon-Key trotz gültiger Loopback-URL', () => {
    expect(() =>
      assertLoopbackSupabaseEnv('http://127.0.0.1:54321', undefined)
    ).toThrow()
  })

  test('wirft nicht und liefert { url, anonKey } bei gültigen Werten', () => {
    expect(
      assertLoopbackSupabaseEnv('http://localhost:54321', 'anon-key')
    ).toEqual({ url: 'http://localhost:54321', anonKey: 'anon-key' })
  })

  test('Fehlermeldung bei ungültiger URL enthält niemals den anonKey-Wert', () => {
    const secretLookingKey = 'super-secret-anon-key-value'
    try {
      assertLoopbackSupabaseEnv('https://xyz.supabase.co', secretLookingKey)
      throw new Error('assertLoopbackSupabaseEnv hätte werfen müssen')
    } catch (err) {
      expect((err as Error).message).not.toContain(secretLookingKey)
    }
  })
})

test.describe('getLoopbackSupabaseEnv', () => {
  test('liest gültige Loopback-Werte aus process.env', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      expect(getLoopbackSupabaseEnv()).toEqual({
        url: 'http://localhost:54321',
        anonKey: 'test-anon-key',
      })
    } finally {
      if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl

      if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
    }
  })

  test('wirft bei Cloud-URL in process.env, ohne .env.local zu lesen', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      expect(() => getLoopbackSupabaseEnv()).toThrow()
    } finally {
      if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl

      if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
    }
  })
})
