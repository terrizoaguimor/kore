'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, User, Flag, Tag, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { TaskPriority, TaskStatus, TaskCategory, Task } from '@/types/planning'
import { toast } from 'sonner'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  planId: string
  task?: Task | null
  users?: Array<{ id: string; name: string; email: string }>
}

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' }
]

const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'ON_HOLD', label: 'En Espera' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' }
]

const categories: { value: TaskCategory; label: string }[] = [
  { value: 'CAMPAIGN', label: 'Campana' },
  { value: 'CONTENT', label: 'Contenido' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'EVENT', label: 'Evento' },
  { value: 'MEETING', label: 'Reunion' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OTHER', label: 'Otro' }
]

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  planId,
  task,
  users = []
}: TaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'PENDING' as TaskStatus,
    category: 'OTHER' as TaskCategory,
    startDate: '',
    dueDate: '',
    progress: 0,
    assignedToId: ''
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        priority: task.priority,
        status: task.status,
        category: task.category,
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        progress: task.progress,
        assignedToId: task.assignedToId || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        notes: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        category: 'OTHER',
        startDate: '',
        dueDate: '',
        progress: 0,
        assignedToId: ''
      })
    }
  }, [task, isOpen])

  const handleImproveWithAI = async () => {
    if (!formData.title.trim()) {
      toast.error('Ingresa un titulo primero')
      return
    }

    setAiLoading(true)
    setShowAiSuggestions(false)
    try {
      const response = await fetch('/api/planning/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'improve',
          prompt: `${formData.title}${formData.description ? ': ' + formData.description : ''}`
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          description: data.data.improved || prev.description
        }))
        setAiSuggestions(data.data.suggestions || [])
        setShowAiSuggestions(true)
        toast.success('Descripcion mejorada con IA')
      } else {
        toast.error('Error al mejorar con IA')
      }
    } catch {
      toast.error('Error al conectar con IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('El titulo es requerido')
      return
    }

    setLoading(true)
    try {
      const url = task
        ? `/api/planning/tasks/${task.id}`
        : `/api/planning/plans/${planId}/tasks`

      const response = await fetch(url, {
        method: task ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          assignedToId: formData.assignedToId || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(task ? 'Tarea actualizada' : 'Tarea creada')
        onSave()
        onClose()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-200">
            <h2 className="text-xl font-bold text-base-content">
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Titulo *</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Nombre de la tarea"
                required
              />
            </div>

            {/* Description with AI */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripcion
                </span>
                <button
                  type="button"
                  onClick={handleImproveWithAI}
                  disabled={aiLoading || !formData.title.trim()}
                  className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      Mejorar con IA
                    </>
                  )}
                </button>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Descripcion de la tarea..."
              />
            </div>

            {/* AI Suggestions */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-primary">Sugerencias de IA</span>
                  <button
                    type="button"
                    onClick={() => setShowAiSuggestions(false)}
                    className="ml-auto btn btn-ghost btn-xs btn-circle"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-base-content/80">
                      <span className="text-primary mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Priority, Status, Category */}
            <div className="grid grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Prioridad
                  </span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="select select-bordered w-full"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Estado</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="select select-bordered w-full"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Categoria
                  </span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                  className="select select-bordered w-full"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha Inicio
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha Vencimiento
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            {/* Assigned To */}
            {users.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Asignar a
                  </span>
                </label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Sin asignar</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Progress */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Progreso: {formData.progress}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="range range-primary"
                step="10"
              />
              <div className="w-full flex justify-between text-xs px-2 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Notes */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Notas</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea textarea-bordered h-20"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  task ? 'Actualizar' : 'Crear Tarea'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
