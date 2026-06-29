import { Badge } from '@/components/ui/Badge'

type RsvpStatus = string | null | undefined

const statusMap: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string }> = {
  attending: { variant: 'success', label: 'Zugesagt' },
  declined:  { variant: 'danger',  label: 'Abgesagt' },
  maybe:     { variant: 'warning', label: 'Vielleicht' },
}

export function RsvpStatusBadge({ status }: { status: RsvpStatus }) {
  if (!status || !(status in statusMap)) {
    return <Badge variant="outline">Ausstehend</Badge>
  }
  const { variant, label } = statusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}
