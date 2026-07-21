import { test, expect } from '@playwright/test'
import { viennaLocalToUTC, utcToViennaLocal } from '../../src/lib/datetime'

// Reine Tests für src/lib/datetime.ts, ohne Browser-Fixture (keine `page`-
// Destrukturierung in den test()-Callbacks -> Playwright startet dafür
// keinen Browser). Kein neuer Test-Runner, keine neuen Pakete.
//
// DST-Referenztage 2026 (Europe/Vienna, letzter Sonntag im Monat):
//   Sommerzeit-Beginn: 2026-03-29, 02:00 -> 03:00 (02:xx existiert nicht)
//   Winterzeit-Beginn: 2026-10-25, 03:00 -> 02:00 (02:xx existiert zweimal)

test.describe('viennaLocalToUTC / utcToViennaLocal', () => {
  test('normale Winterzeit (CET, UTC+1)', () => {
    expect(viennaLocalToUTC('2026-01-15', '12:00')).toBe('2026-01-15T11:00:00.000Z')
  })

  test('normale Sommerzeit (CEST, UTC+2)', () => {
    expect(viennaLocalToUTC('2026-07-15', '12:00')).toBe('2026-07-15T10:00:00.000Z')
  })

  test('utcToViennaLocal: Winterzeit-Referenz', () => {
    expect(utcToViennaLocal('2026-01-15T11:00:00.000Z')).toEqual({
      date: '2026-01-15',
      time: '12:00',
    })
  })

  test('utcToViennaLocal: Sommerzeit-Referenz', () => {
    expect(utcToViennaLocal('2026-07-15T10:00:00.000Z')).toEqual({
      date: '2026-07-15',
      time: '12:00',
    })
  })

  test('ungültiges Kalenderdatum (2026-02-30) wirft Fehler', () => {
    expect(() => viennaLocalToUTC('2026-02-30', '12:00')).toThrow()
  })

  test('ungültiger Monat (2026-13-01) wirft Fehler', () => {
    expect(() => viennaLocalToUTC('2026-13-01', '12:00')).toThrow()
  })

  test('ungültiges Datumsformat wirft Fehler', () => {
    expect(() => viennaLocalToUTC('30.02.2026', '12:00')).toThrow()
  })

  test('ungültige Uhrzeit (25:70) wirft Fehler', () => {
    expect(() => viennaLocalToUTC('2026-07-15', '25:70')).toThrow()
  })

  test('ungültiges Uhrzeitformat wirft Fehler', () => {
    expect(() => viennaLocalToUTC('2026-07-15', 'abc')).toThrow()
  })

  test('leere Uhrzeit wirft Fehler', () => {
    expect(() => viennaLocalToUTC('2026-07-15', '')).toThrow()
  })

  test('nicht existierende Lokalzeit beim Sommerzeit-Beginn wirft Fehler', () => {
    // Vienna springt am 2026-03-29 von 02:00 auf 03:00 -> 02:30 existiert nicht.
    expect(() => viennaLocalToUTC('2026-03-29', '02:30')).toThrow()
  })

  test('gültige Zeiten unmittelbar vor/nach dem Sommerzeit-Sprung funktionieren', () => {
    // 01:30 liegt noch in CET (+1h) -> 2026-03-29T00:30:00.000Z
    expect(viennaLocalToUTC('2026-03-29', '01:30')).toBe('2026-03-29T00:30:00.000Z')
    // 03:30 liegt bereits in CEST (+2h) -> 2026-03-29T01:30:00.000Z
    expect(viennaLocalToUTC('2026-03-29', '03:30')).toBe('2026-03-29T01:30:00.000Z')
  })

  test('mehrdeutige Lokalzeit beim Winterzeit-Beginn wählt deterministisch die frühere UTC-Entsprechung', () => {
    // Vienna fällt am 2026-10-25 von 03:00 CEST auf 02:00 CET zurück ->
    // 02:30 existiert zweimal: 2026-10-25T00:30:00.000Z (CEST, +2h) und
    // 2026-10-25T01:30:00.000Z (CET, +1h). Festgelegte Regel: die frühere
    // (Sommerzeit-)Entsprechung wird gewählt.
    expect(viennaLocalToUTC('2026-10-25', '02:30')).toBe('2026-10-25T00:30:00.000Z')
  })

  test('Roundtrip: viennaLocalToUTC -> utcToViennaLocal ergibt die ursprüngliche Eingabe', () => {
    const cases: Array<[string, string]> = [
      ['2026-01-15', '12:00'],
      ['2026-07-15', '18:30'],
      ['2026-03-29', '01:30'],
      ['2026-03-29', '03:30'],
      ['2026-12-31', '23:59'],
      ['2026-01-01', '00:00'],
    ]

    for (const [date, time] of cases) {
      const utc = viennaLocalToUTC(date, time)
      expect(utcToViennaLocal(utc)).toEqual({ date, time })
    }
  })

  test('utcToViennaLocal wirft bei ungültigem Zeitstempel', () => {
    expect(() => utcToViennaLocal('nicht-ein-datum')).toThrow()
  })
})
