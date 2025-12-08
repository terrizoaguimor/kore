'use client'

import { TaskPriority } from '@/types/planning'

interface PriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Baja', className: 'badge-ghost' },
  MEDIUM: { label: 'Media', className: 'badge-info' },
  HIGH: { label: 'Alta', className: 'badge-warning' },
  URGENT: { label: 'Urgente', className: 'badge-error' }
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span className={`badge ${config.className} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {config.label}
    </span>
  )
}
