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
  CAMPAIGN: { label: 'Campana', className: 'bg-[#00E5FF]/20 text-[#00E5FF]', icon: Megaphone },
  CONTENT: { label: 'Contenido', className: 'bg-[#A78BFA]/20 text-[#A78BFA]', icon: FileText },
  SOCIAL: { label: 'Social', className: 'bg-[#FF4757]/20 text-[#FF4757]', icon: Share2 },
  EVENT: { label: 'Evento', className: 'bg-[#00E5FF]/20 text-[#00E5FF]', icon: Calendar },
  MEETING: { label: 'Reunion', className: 'bg-[#FFB830]/20 text-[#FFB830]', icon: Users },
  ADMIN: { label: 'Admin', className: 'bg-[#2A2A2A] text-[#A1A1AA]', icon: Briefcase },
  OTHER: { label: 'Otro', className: 'bg-[#2A2A2A] text-[#A1A1AA]', icon: MoreHorizontal }
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
