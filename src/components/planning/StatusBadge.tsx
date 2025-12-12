'use client'

import { TaskStatus } from '@/types/planning'

interface StatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-[#2d3c8a] text-[#A1A1AA]' },
  IN_PROGRESS: { label: 'En Progreso', className: 'bg-[#0046E2]/20 text-[#0046E2]' },
  ON_HOLD: { label: 'En Espera', className: 'bg-[#0046E2]/20 text-[#0046E2]' },
  COMPLETED: { label: 'Completado', className: 'bg-[#00D68F]/20 text-[#00D68F]' },
  CANCELLED: { label: 'Cancelado', className: 'bg-[#FF4757]/20 text-[#FF4757]' }
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`px-2.5 py-1 rounded-md font-medium ${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {config.label}
    </span>
  )
}
