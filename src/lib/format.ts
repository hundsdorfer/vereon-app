export function formatTrainingDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-AT', {
    timeZone: 'Europe/Vienna',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
