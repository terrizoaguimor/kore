'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  FolderKanban,
  X,
  Loader2,
  Calendar,
  Sparkles,
  FileText
} from 'lucide-react'
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
import PlanCard from '@/components/planning/PlanCard'
import { Plan, AIPlan } from '@/types/planning'
import { toast } from 'sonner'

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createMode, setCreateMode] = useState<'manual' | 'ai'>('manual')
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [yearFilter, statusFilter])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (yearFilter) params.append('year', yearFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/planning/plans?${params}`)
      const data = await response.json()

      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Error al cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlan.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/planning/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Plan creado exitosamente')
        setShowCreateModal(false)
        setNewPlan({
          name: '',
          description: '',
          year: new Date().getFullYear(),
          startDate: '',
          endDate: ''
        })
        fetchPlans()
      } else {
        toast.error(data.error || 'Error al crear el plan')
      }
    } catch {
      toast.error('Error al crear el plan')
    } finally {
      setCreating(false)
    }
  }

  const handleAIPlanGenerated = async (aiPlan: AIPlan) => {
    setCreating(true)
    try {
      const planResponse = await fetch('/api/planning/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiPlan.name,
          description: aiPlan.description,
          year: aiPlan.year,
          startDate: `${aiPlan.year}-01-01`,
          endDate: `${aiPlan.year}-12-31`
        })
      })

      const planData = await planResponse.json()

      if (!planData.success) {
        toast.error(planData.error || 'Error al crear el plan')
        return
      }

      const planId = planData.data.id

      let tasksCreated = 0
      for (const task of aiPlan.tasks) {
        const taskResponse = await fetch(`/api/planning/plans/${planId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            startDate: task.startDate || null,
            dueDate: task.dueDate || null,
            progress: 0
          })
        })

        const taskData = await taskResponse.json()
        if (taskData.success) tasksCreated++
      }

      toast.success(`Plan creado con ${tasksCreated} tareas`)
      setShowCreateModal(false)
      router.push(`/planning/plans/${planId}`)
    } catch (error) {
      console.error('Error creating AI plan:', error)
      toast.error('Error al crear el plan con IA')
    } finally {
      setCreating(false)
    }
  }

  const filteredPlans = plans.filter(plan => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      plan.name.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query)
    )
  })

  const years = Array.from(new Set(plans.map(p => p.year))).sort((a, b) => b - a)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Planes de Accion</h1>
          <p className="text-[#A1A1AA] text-sm mt-1">
            {filteredPlans.length} planes encontrados
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <Input
            type="text"
            placeholder="Buscar planes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#243178] border-[#2d3c8a]"
          />
        </div>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[180px] bg-[#243178] border-[#2d3c8a]">
            <SelectValue placeholder="Todos los años" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los años</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
            <SelectItem value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-[#243178] border-[#2d3c8a]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="ARCHIVED">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0046E2]" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-[#243178] rounded-xl p-12 text-center border border-[#2d3c8a]">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-[#A1A1AA]/30" />
          <h3 className="text-lg font-medium mb-2 text-white">
            {searchQuery || yearFilter || statusFilter
              ? 'No se encontraron planes'
              : 'No hay planes creados'}
          </h3>
          <p className="text-[#A1A1AA] mb-4">
            {searchQuery || yearFilter || statusFilter
              ? 'Intenta con otros filtros de busqueda'
              : 'Crea tu primer plan de accion para comenzar'}
          </p>
          {!searchQuery && !yearFilter && !statusFilter && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Crear Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !creating && setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0f1a4a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-[#2d3c8a]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#2d3c8a]">
                <h2 className="text-xl font-bold text-white">Nuevo Plan de Accion</h2>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => !creating && setShowCreateModal(false)}
                  disabled={creating}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mode Tabs */}
              <div className="flex border-b border-[#2d3c8a]">
                <button
                  onClick={() => setCreateMode('manual')}
                  className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    createMode === 'manual'
                      ? 'text-[#0046E2] border-b-2 border-[#0046E2] bg-[#0046E2]/5'
                      : 'text-[#A1A1AA] hover:bg-[#243178]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Crear Manual
                </button>
                <button
                  onClick={() => setCreateMode('ai')}
                  className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    createMode === 'ai'
                      ? 'text-[#0046E2] border-b-2 border-[#0046E2] bg-[#0046E2]/5'
                      : 'text-[#A1A1AA] hover:bg-[#243178]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Generar con IA
                </button>
              </div>

              {/* AI Mode */}
              {createMode === 'ai' && (
                <div className="p-6">
                  {creating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-[#0046E2] animate-spin mb-4" />
                      <p className="text-[#A1A1AA]">Creando plan y tareas...</p>
                      <p className="text-sm text-[#A1A1AA]/60">Esto puede tomar unos segundos</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#0046E2]" />
                      <p className="text-[#A1A1AA] mb-4">
                        La generacion con IA estara disponible proximamente
                      </p>
                      <Button onClick={() => setCreateMode('manual')}>
                        Crear Manualmente
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Mode */}
              {createMode === 'manual' && (
                <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Nombre *</Label>
                    <Input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="bg-[#243178] border-[#2d3c8a]"
                      placeholder="Ej: Plan Marketing 2025"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Descripcion</Label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      className="w-full h-20 px-3 py-2 rounded-md bg-[#243178] border border-[#2d3c8a] text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2] focus:border-transparent"
                      placeholder="Descripcion del plan..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Año
                    </Label>
                    <Input
                      type="number"
                      value={newPlan.year}
                      onChange={(e) => setNewPlan({ ...newPlan, year: parseInt(e.target.value) })}
                      className="bg-[#243178] border-[#2d3c8a]"
                      min="2020"
                      max="2030"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={newPlan.startDate}
                        onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                        className="bg-[#243178] border-[#2d3c8a]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Fecha Fin</Label>
                      <Input
                        type="date"
                        value={newPlan.endDate}
                        onChange={(e) => setNewPlan({ ...newPlan, endDate: e.target.value })}
                        className="bg-[#243178] border-[#2d3c8a]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Plan'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
