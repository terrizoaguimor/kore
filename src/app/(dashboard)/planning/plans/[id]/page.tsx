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
  LayoutGrid
} from 'lucide-react'
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
    DRAFT: { label: 'Borrador', className: 'badge-ghost' },
    ACTIVE: { label: 'Activo', className: 'badge-success' },
    COMPLETED: { label: 'Completado', className: 'badge-info' },
    ARCHIVED: { label: 'Archivado', className: 'badge-warning' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
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
          <Link
            href="/planning/plans"
            className="btn btn-ghost btn-sm gap-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Planes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-base-content">{plan.name}</h1>
            <span className={`badge ${statusConfig[plan.status].className}`}>
              {statusConfig[plan.status].label}
            </span>
            <span className="text-2xl font-bold text-primary">{plan.year}</span>
          </div>
          {plan.description && (
            <p className="text-base-content/60 mt-1">{plan.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchPlan}
            className="btn btn-outline btn-sm gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-outline btn-sm gap-2">
              <Settings className="w-4 h-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-52">
              <li>
                <button onClick={handleDeletePlan} className="text-error">
                  <Trash2 className="w-4 h-4" />
                  Eliminar Plan
                </button>
              </li>
            </ul>
          </div>
          <button
            onClick={handleAddTask}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              <p className="text-sm text-base-content/60">Tareas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-base-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{plan.overallProgress}%</p>
              <p className="text-sm text-base-content/60">Progreso</p>
            </div>
          </div>
        </motion.div>

        {plan.startDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-base-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-info" />
              <div>
                <p className="text-lg font-bold">{formatDate(plan.startDate)}</p>
                <p className="text-sm text-base-content/60">Inicio</p>
              </div>
            </div>
          </motion.div>
        )}

        {plan.endDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-base-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-warning" />
              <div>
                <p className="text-lg font-bold">{formatDate(plan.endDate)}</p>
                <p className="text-sm text-base-content/60">Fin</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-base-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Progreso General</span>
          <span className="font-bold text-primary">{plan.overallProgress}%</span>
        </div>
        <ProgressBar progress={plan.overallProgress} size="lg" showLabel={false} />
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Tareas ({totalTasks})</h2>
        <div className="join">
          <button
            onClick={() => setView('list')}
            className={`join-item btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('gantt')}
            className={`join-item btn btn-sm ${view === 'gantt' ? 'btn-primary' : 'btn-ghost'}`}
            disabled
            title="Gantt - Proximamente"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
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
