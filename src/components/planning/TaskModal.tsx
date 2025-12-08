'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, User, Flag, Tag, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { TaskPriority, TaskStatus, TaskCategory, Task } from '@/types/planning'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
          className="relative bg-[#0B0B0B] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
            <h2 className="text-xl font-bold text-white">
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-medium">Titulo *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white"
                placeholder="Nombre de la tarea"
                required
              />
            </div>

            {/* Description with AI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-white font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripcion
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImproveWithAI}
                  disabled={aiLoading || !formData.title.trim()}
                  className="gap-1 text-[#00E5FF] hover:bg-[#00E5FF]/10 h-7 text-xs"
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
                </Button>
              </div>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-24 px-3 py-2 rounded-md bg-[#1F1F1F] border border-[#2A2A2A] text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent resize-none"
                placeholder="Descripcion de la tarea..."
              />
            </div>

            {/* AI Suggestions */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                  <span className="font-medium text-sm text-[#00E5FF]">Sugerencias de IA</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAiSuggestions(false)}
                    className="ml-auto h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="text-[#00E5FF] mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Priority, Status, Category */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Prioridad
                </Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}>
                  <SelectTrigger className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0B] border-[#2A2A2A]">
                    {priorities.map(p => (
                      <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}>
                  <SelectTrigger className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0B] border-[#2A2A2A]">
                    {statuses.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoria
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TaskCategory })}>
                  <SelectTrigger className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0B] border-[#2A2A2A]">
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Vencimiento
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white"
                />
              </div>
            </div>

            {/* Assigned To */}
            {users.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Asignar a
                </Label>
                <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                  <SelectTrigger className="w-full bg-[#1F1F1F] border-[#2A2A2A] text-white">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0B] border-[#2A2A2A]">
                    <SelectItem value="" className="text-white">Sin asignar</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id} className="text-white">{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Progreso: {formData.progress}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00E5FF] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00E5FF] [&::-moz-range-thumb]:border-0"
                step="10"
              />
              <div className="w-full flex justify-between text-xs px-2 text-[#A1A1AA]">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white font-medium">Notas</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-20 px-3 py-2 rounded-md bg-[#1F1F1F] border border-[#2A2A2A] text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent resize-none"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90"
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
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
