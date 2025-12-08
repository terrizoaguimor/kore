'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckSquare, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ProgressBar from './ProgressBar'
import { ActionPlanStatus, Plan } from '@/types/planning'
import { Button } from '@/components/ui/button'

interface PlanCardProps {
  plan: Plan
  index?: number
}

const statusConfig: Record<ActionPlanStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-[#2A2A2A] text-[#A1A1AA]' },
  ACTIVE: { label: 'Activo', className: 'bg-[#00D68F]/20 text-[#00D68F]' },
  COMPLETED: { label: 'Completado', className: 'bg-[#00E5FF]/20 text-[#00E5FF]' },
  ARCHIVED: { label: 'Archivado', className: 'bg-[#FFB830]/20 text-[#FFB830]' }
}

export default function PlanCard({ plan, index = 0 }: PlanCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#1F1F1F] rounded-xl p-6 hover:bg-[#2A2A2A]/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig[plan.status].className}`}>
              {statusConfig[plan.status].label}
            </span>
          </div>
          <p className="text-sm text-[#A1A1AA]">
            {plan.description || `Plan anual ${plan.year}`}
          </p>
        </div>
        <span className="text-2xl font-bold text-[#00E5FF]">{plan.year}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <ProgressBar progress={plan.overallProgress} size="md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckSquare className="w-4 h-4 text-[#00D68F]" />
          <span className="text-white/70">
            {plan.completedTaskCount}/{plan.taskCount} tareas
          </span>
        </div>
        {plan.startDate && plan.endDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-white/70">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-[#FFB830]" />
          <span className="text-white/70 truncate">
            {plan.createdBy.name}
          </span>
        </div>
      </div>

      {/* Action */}
      <Button
        asChild
        className="w-full group-hover:gap-3 transition-all bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90"
        size="sm"
      >
        <Link href={`/planning/plans/${plan.id}`}>
          Ver Plan
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </motion.div>
  )
}
