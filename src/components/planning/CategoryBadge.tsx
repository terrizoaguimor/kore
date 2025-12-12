'use client'

import { TaskCategory } from '@/types/planning'
import {
  Megaphone,
  FileText,
  Share2,
  Calendar,
  Users,
  Briefcase,
  MoreHorizontal
} from 'lucide-react'

interface CategoryBadgeProps {
  category: TaskCategory
  size?: 'sm' | 'md'
  showIcon?: boolean
}

const categoryConfig: Record<TaskCategory, { label: string; className: string; icon: typeof Megaphone }> = {
  CAMPAIGN: { label: 'Campana', className: 'bg-[#0046E2]/20 text-[#0046E2]', icon: Megaphone },
  CONTENT: { label: 'Contenido', className: 'bg-[#A78BFA]/20 text-[#A78BFA]', icon: FileText },
  SOCIAL: { label: 'Social', className: 'bg-[#FF4757]/20 text-[#FF4757]', icon: Share2 },
  EVENT: { label: 'Evento', className: 'bg-[#0046E2]/20 text-[#0046E2]', icon: Calendar },
  MEETING: { label: 'Reunion', className: 'bg-[#0046E2]/20 text-[#0046E2]', icon: Users },
  ADMIN: { label: 'Admin', className: 'bg-[#2d3c8a] text-[#A1A1AA]', icon: Briefcase },
  OTHER: { label: 'Otro', className: 'bg-[#2d3c8a] text-[#A1A1AA]', icon: MoreHorizontal }
}

export default function CategoryBadge({ category, size = 'md', showIcon = true }: CategoryBadgeProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  )
}
