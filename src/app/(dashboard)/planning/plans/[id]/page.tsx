'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Calendar,
  CheckSquare,
  BarChart3,
  List,
  LayoutGrid,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import TaskTable from '@/components/planning/TaskTable'
import TaskModal from '@/components/planning/TaskModal'
import ProgressBar from '@/components/planning/ProgressBar'
import { Plan, Task, ActionPlanStatus } from '@/types/planning'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
}

export default function PlanDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'gantt'>('list')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [parentTaskId, setParentTaskId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlan()
    fetchUsers()
  }, [id])

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/planning/plans/${id}`)
      const data = await response.json()

      if (data.success) {
        setPlan(data.data)
      } else {
        toast.error('Plan no encontrado')
        router.push('/planning/plans')
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
      toast.error('Error al cargar el plan')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setParentTaskId(null)
    setShowTaskModal(true)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setParentTaskId(null)
    setShowTaskModal(true)
  }

  const handleAddSubtask = (parentId: string) => {
    setEditingTask(null)
    setParentTaskId(parentId)
    setShowTaskModal(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Estas seguro de eliminar esta tarea?')) return

    try {
      const response = await fetch(`/api/planning/tasks/${taskId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Tarea eliminada')
        fetchPlan()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar la tarea')
    }
  }

  const handleDeletePlan = async () => {
    if (!confirm('Estas seguro de eliminar este plan? Se eliminaran todas las tareas asociadas.')) return

    try {
      const response = await fetch(`/api/planning/plans/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Plan eliminado')
        router.push('/planning/plans')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar el plan')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const statusConfig: Record<ActionPlanStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Borrador', className: 'bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]' },
    ACTIVE: { label: 'Activo', className: 'bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20' },
    COMPLETED: { label: 'Completado', className: 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' },
    ARCHIVED: { label: 'Archivado', className: 'bg-[#FFB830]/10 text-[#FFB830] border border-[#FFB830]/20' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF]" />
      </div>
    )
  }

  if (!plan) {
    return null
  }

  const completedTasks = plan.tasks?.filter(t => t.status === 'COMPLETED').length || 0
  const totalTasks = plan.tasks?.length || 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 mb-2" asChild>
            <Link href="/planning/plans">
              <ArrowLeft className="w-4 h-4" />
              Volver a Planes
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${statusConfig[plan.status].className}`}>
              {statusConfig[plan.status].label}
            </span>
            <span className="text-2xl font-bold text-[#00E5FF]">{plan.year}</span>
          </div>
          {plan.description && (
            <p className="text-[#A1A1AA] mt-1">{plan.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchPlan}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0B0B0B] border border-[#27272A] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleDeletePlan}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-[#1F1F1F] rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Plan
              </button>
            </div>
          </div>
          <Button
            onClick={handleAddTask}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1F1F1F] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-[#00D68F]" />
            <div>
              <p className="text-2xl font-bold text-white">{completedTasks}/{totalTasks}</p>
              <p className="text-sm text-[#A1A1AA]">Tareas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1F1F1F] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#00E5FF]" />
            <div>
              <p className="text-2xl font-bold text-white">{plan.overallProgress}%</p>
              <p className="text-sm text-[#A1A1AA]">Progreso</p>
            </div>
          </div>
        </motion.div>

        {plan.startDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1F1F1F] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#00E5FF]" />
              <div>
                <p className="text-lg font-bold text-white">{formatDate(plan.startDate)}</p>
                <p className="text-sm text-[#A1A1AA]">Inicio</p>
              </div>
            </div>
          </motion.div>
        )}

        {plan.endDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1F1F1F] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#FFB830]" />
              <div>
                <p className="text-lg font-bold text-white">{formatDate(plan.endDate)}</p>
                <p className="text-sm text-[#A1A1AA]">Fin</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1F1F1F] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-white">Progreso General</span>
          <span className="font-bold text-[#00E5FF]">{plan.overallProgress}%</span>
        </div>
        <ProgressBar progress={plan.overallProgress} size="lg" showLabel={false} />
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Tareas ({totalTasks})</h2>
        <div className="flex border border-[#27272A] rounded-lg overflow-hidden">
          <Button
            onClick={() => setView('list')}
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none border-r border-[#27272A]"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setView('gantt')}
            variant={view === 'gantt' ? 'default' : 'ghost'}
            size="sm"
            disabled
            title="Gantt - Proximamente"
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <TaskTable
        tasks={plan.tasks || []}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleComplete={() => {}}
        onRefresh={fetchPlan}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
          setParentTaskId(null)
        }}
        onSave={fetchPlan}
        planId={id}
        task={editingTask}
        users={users}
      />
    </div>
  )
}
