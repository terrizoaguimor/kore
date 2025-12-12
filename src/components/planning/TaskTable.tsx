'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  Link2,
  Loader2
} from 'lucide-react'
import { Task } from '@/types/planning'
import PriorityBadge from './PriorityBadge'
import StatusBadge from './StatusBadge'
import CategoryBadge from './CategoryBadge'
import ProgressBar from './ProgressBar'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onAddSubtask: (parentId: string) => void
  onToggleComplete: (taskId: string, completed: boolean) => void
  onRefresh: () => void
}

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onRefresh
}: TaskTableProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    })
  }

  const handleQuickComplete = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    setUpdating(task.id)

    try {
      const response = await fetch(`/api/planning/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        onToggleComplete(task.id, newStatus === 'COMPLETED')
        onRefresh()
      } else if (data.blockedBy) {
        toast.error(`Bloqueada por: ${data.blockedBy.join(', ')}`)
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setUpdating(null)
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const renderTask = (task: Task, isSubtask = false, index = 0) => {
    const hasSubtasks = (task.subtasks && task.subtasks.length > 0) || (task._count?.subtasks && task._count.subtasks > 0)
    const isExpanded = expandedTasks.has(task.id)
    const isBlocked = task.dependsOn && task.dependsOn.some(d => d.blockingTask.status !== 'COMPLETED')

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`${isSubtask ? 'ml-8 border-l-2 border-[#2d3c8a] pl-4' : ''}`}
      >
        <div
          className={`
            flex items-center gap-3 p-3 rounded-lg transition-colors
            ${task.status === 'COMPLETED' ? 'bg-[#00D68F]/10' : 'bg-[#243178] hover:bg-[#2d3c8a]/50'}
            ${isBlocked ? 'opacity-70' : ''}
          `}
        >
          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => hasSubtasks && toggleExpanded(task.id)}
            className={`h-8 w-8 ${!hasSubtasks ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>

          {/* Complete Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleQuickComplete(task)}
            disabled={updating === task.id || isBlocked}
            className={`h-8 w-8 ${isBlocked ? 'cursor-not-allowed' : ''}`}
            title={isBlocked ? 'Tarea bloqueada' : task.status === 'COMPLETED' ? 'Marcar pendiente' : 'Marcar completada'}
          >
            {updating === task.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : task.status === 'COMPLETED' ? (
              <CheckCircle2 className="w-5 h-5 text-[#00D68F]" />
            ) : (
              <Circle className="w-5 h-5 text-white/40" />
            )}
          </Button>

          {/* Title & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${task.status === 'COMPLETED' ? 'line-through text-white/50' : 'text-white'}`}>
                {task.title}
              </span>
              {isBlocked && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#FF4757]/20 text-[#FF4757]">Bloqueada</span>
              )}
              {hasSubtasks && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#2d3c8a] text-[#A1A1AA]">
                  {task._count?.subtasks || task.subtasks?.length} subtareas
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                {task.description}
              </p>
            )}
          </div>

          {/* Category */}
          <CategoryBadge category={task.category} size="sm" />

          {/* Priority */}
          <PriorityBadge priority={task.priority} size="sm" />

          {/* Status */}
          <StatusBadge status={task.status} size="sm" />

          {/* Progress */}
          <div className="w-24">
            <ProgressBar progress={task.progress} size="sm" />
          </div>

          {/* Dates */}
          <div className="flex items-center gap-1 text-xs text-[#A1A1AA] w-28">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? 'text-[#FF4757]' : ''}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Assignee */}
          <div className="w-24">
            {task.assignedTo ? (
              <div className="flex items-center gap-1 text-xs text-white">
                <User className="w-3 h-3 text-[#A1A1AA]" />
                <span className="truncate">{task.assignedTo.name.split(' ')[0]}</span>
              </div>
            ) : (
              <span className="text-xs text-white/40">Sin asignar</span>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#0f1a4a] border-[#2d3c8a]">
              <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {!isSubtask && (
                <DropdownMenuItem onClick={() => onAddSubtask(task.id)} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Subtarea
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => {}} className="cursor-pointer">
                <Link2 className="w-4 h-4 mr-2" />
                Gestionar Dependencias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="cursor-pointer text-[#FF4757]">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Subtasks */}
        <AnimatePresence>
          {isExpanded && task.subtasks && task.subtasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {task.subtasks.map((subtask, idx) => renderTask(subtask, true, idx))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-[#A1A1AA]">
        <p>No hay tareas. Crea una nueva para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => renderTask(task, false, index))}
    </div>
  )
}
