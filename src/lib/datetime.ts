const VIENNA_TZ = 'Europe/Vienna'

// Europe/Vienna kennt in der Neuzeit ausschließlich diese beiden Offsets
// (MEZ/CET = +60min, MESZ/CEST = +120min). Damit lässt sich Mehrdeutigkeit
// bei der Winterzeit-Umstellung und Nichtexistenz bei der Sommerzeit-
// Umstellung geschlossen prüfen, ohne eine Zeitzonen-Bibliothek einzuführen.
const VIENNA_OFFSET_CANDIDATES_MIN = [60, 120] as const

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^(\d{2}):(\d{2})$/

function parseAndValidateDate(dateStr: string): { year: number; month: number; day: number } {
  const match = DATE_RE.exec(dateStr)
  if (!match) {
    throw new Error('Ungültiges Datumsformat.')
  }

  const year  = Number(match[1])
  const month = Number(match[2])
  const day   = Number(match[3])

  // Date.UTC rollt ungültige Kalenderdaten (z. B. 2026-02-30 -> 2026-03-02)
  // still über. Rückvergleich der normalisierten Felder deckt das auf.
  const check = new Date(Date.UTC(year, month - 1, day))
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error('Ungültiges Kalenderdatum.')
  }

  return { year, month, day }
}

function parseAndValidateTime(timeStr: string): { hour: number; minute: number } {
  const match = TIME_RE.exec(timeStr)
  if (!match) {
    throw new Error('Ungültiges Uhrzeitformat.')
  }

  const hour   = Number(match[1])
  const minute = Number(match[2])

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Ungültige Uhrzeit.')
  }

  return { hour, minute }
}

// Liefert den Wien-UTC-Offset in Minuten für einen konkreten UTC-Zeitpunkt
// (positiv: Wien ist der UTC-Zeit voraus).
function viennaOffsetMinutesAt(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIENNA_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)

  const asUtcMs = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    get('hour'), get('minute'), get('second'),
  )

  return (asUtcMs - utcMs) / 60_000
}

/**
 * Wandelt ein Datum/Uhrzeit-Paar aus einem `<input type="date">` /
 * `<input type="time">`-Formular (interpretiert als Europe/Vienna-Lokalzeit)
 * in einen UTC-ISO-String.
 *
 * Wirft bei ungültigem Format, ungültigem Kalenderdatum und bei einer
 * Lokalzeit, die durch den Sommerzeit-Beginn nicht existiert.
 *
 * Bei einer durch den Winterzeit-Beginn doppelt vorkommenden Lokalzeit wird
 * deterministisch die frühere UTC-Entsprechung (Sommerzeit-Offset, +120min)
 * gewählt — bewusste, dokumentierte Regel statt stillem Raten.
 */
export function viennaLocalToUTC(dateStr: string, timeStr: string): string {
  const { year, month, day } = parseAndValidateDate(dateStr)
  const { hour, minute }     = parseAndValidateTime(timeStr)

  // Numerische Rohwerte der gewünschten Lokalzeit, zunächst ohne Offset.
  const naiveMs = Date.UTC(year, month - 1, day, hour, minute, 0)

  const validCandidatesMs: number[] = []
  for (const offsetMin of VIENNA_OFFSET_CANDIDATES_MIN) {
    const candidateMs = naiveMs - offsetMin * 60_000
    if (viennaOffsetMinutesAt(candidateMs) === offsetMin) {
      validCandidatesMs.push(candidateMs)
    }
  }

  if (validCandidatesMs.length === 0) {
    throw new Error(
      'Diese Uhrzeit existiert an diesem Tag in Wien nicht (Sommerzeit-Umstellung).',
    )
  }

  // Mehrdeutig (Winterzeit-Beginn): frühere UTC-Entsprechung = kleinerer ms-Wert.
  const resolvedMs = Math.min(...validCandidatesMs)
  return new Date(resolvedMs).toISOString()
}

/**
 * Gegenstück zu `viennaLocalToUTC`: wandelt einen UTC-ISO-String in
 * Datum/Uhrzeit-Strings für `<input type="date">` / `<input type="time">`,
 * interpretiert in Europe/Vienna-Lokalzeit.
 */
export function utcToViennaLocal(isoUTC: string): { date: string; time: string } {
  const ms = new Date(isoUTC).getTime()
  if (Number.isNaN(ms)) {
    throw new Error('Ungültiger Zeitstempel.')
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIENNA_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(ms))

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}
