'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckSquare, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ProgressBar from './ProgressBar'
import { ActionPlanStatus, Plan } from '@/types/planning'

interface PlanCardProps {
  plan: Plan
  index?: number
}

const statusConfig: Record<ActionPlanStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'badge-ghost' },
  ACTIVE: { label: 'Activo', className: 'badge-success' },
  COMPLETED: { label: 'Completado', className: 'badge-info' },
  ARCHIVED: { label: 'Archivado', className: 'badge-warning' }
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
      className="bg-base-200 rounded-xl p-6 hover:bg-base-300/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-base-content">{plan.name}</h3>
            <span className={`badge ${statusConfig[plan.status].className}`}>
              {statusConfig[plan.status].label}
            </span>
          </div>
          <p className="text-sm text-base-content/60">
            {plan.description || `Plan anual ${plan.year}`}
          </p>
        </div>
        <span className="text-2xl font-bold text-primary">{plan.year}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <ProgressBar progress={plan.overallProgress} size="md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckSquare className="w-4 h-4 text-success" />
          <span className="text-base-content/70">
            {plan.completedTaskCount}/{plan.taskCount} tareas
          </span>
        </div>
        {plan.startDate && plan.endDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-info" />
            <span className="text-base-content/70">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-warning" />
          <span className="text-base-content/70 truncate">
            {plan.createdBy.name}
          </span>
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/planning/plans/${plan.id}`}
        className="btn btn-primary btn-sm w-full group-hover:gap-3 transition-all"
      >
        Ver Plan
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  )
}
