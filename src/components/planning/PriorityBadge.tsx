'use client'

import { TaskPriority } from '@/types/planning'

interface PriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Baja', className: 'bg-[#2d3c8a] text-[#A1A1AA]' },
  MEDIUM: { label: 'Media', className: 'bg-[#0046E2]/20 text-[#0046E2]' },
  HIGH: { label: 'Alta', className: 'bg-[#0046E2]/20 text-[#0046E2]' },
  URGENT: { label: 'Urgente', className: 'bg-[#FF4757]/20 text-[#FF4757]' }
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span className={`px-2.5 py-1 rounded-md font-medium ${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {config.label}
    </span>
  )
}
