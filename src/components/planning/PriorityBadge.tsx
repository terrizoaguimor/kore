'use client'

import { TaskPriority } from '@/types/planning'

interface PriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Baja', className: 'bg-[#2A2A2A] text-[#A1A1AA]' },
  MEDIUM: { label: 'Media', className: 'bg-[#00E5FF]/20 text-[#00E5FF]' },
  HIGH: { label: 'Alta', className: 'bg-[#FFB830]/20 text-[#FFB830]' },
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
