'use client'

import { TaskStatus } from '@/types/planning'

interface StatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'badge-ghost' },
  IN_PROGRESS: { label: 'En Progreso', className: 'badge-primary' },
  ON_HOLD: { label: 'En Espera', className: 'badge-warning' },
  COMPLETED: { label: 'Completado', className: 'badge-success' },
  CANCELLED: { label: 'Cancelado', className: 'badge-error' }
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`badge ${config.className} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {config.label}
    </span>
  )
}
