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
  CAMPAIGN: { label: 'Campana', className: 'badge-primary', icon: Megaphone },
  CONTENT: { label: 'Contenido', className: 'badge-secondary', icon: FileText },
  SOCIAL: { label: 'Social', className: 'badge-accent', icon: Share2 },
  EVENT: { label: 'Evento', className: 'badge-info', icon: Calendar },
  MEETING: { label: 'Reunion', className: 'badge-warning', icon: Users },
  ADMIN: { label: 'Admin', className: 'badge-ghost', icon: Briefcase },
  OTHER: { label: 'Otro', className: 'badge-neutral', icon: MoreHorizontal }
}

export default function CategoryBadge({ category, size = 'md', showIcon = true }: CategoryBadgeProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <span className={`badge ${config.className} ${size === 'sm' ? 'badge-sm' : ''} gap-1`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  )
}
