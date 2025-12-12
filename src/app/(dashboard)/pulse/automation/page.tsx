"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Zap, ArrowLeft, Plus, Play, Pause, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AutomationBuilder } from "@/components/marketing"
import type { MarketingAutomation, AutomationStatus } from "@/types/marketing"
import { useToast } from "@/hooks/use-toast"

// Demo automations
const demoAutomations: MarketingAutomation[] = [
  {
    id: '1',
    organization_id: 'org-1',
    created_by: null,
    name: 'Bienvenida Nuevos Suscriptores',
    description: 'Secuencia de emails de bienvenida para nuevos suscriptores del newsletter',
    status: 'active',
    trigger_type: 'event',
    trigger_config: { eventName: 'contact_created', conditions: [{ list: 'newsletter' }] },
    steps: [
      { id: 's1', type: 'send_email', config: { template_id: '1', subject: 'Bienvenido a KORE' }, nextStepId: 's2' },
      { id: 's2', type: 'wait', config: { duration: 3, unit: 'days' }, nextStepId: 's3' },
      { id: 's3', type: 'send_email', config: { template_id: '2', subject: 'Descubre nuestros servicios' }, nextStepId: 's4' },
      { id: 's4', type: 'update_record', config: { tag_name: 'onboarding_complete' } },
    ],
    total_executions: 1250,
    successful_executions: 1180,
    failed_executions: 70,
    last_execution_at: '2024-06-15T10:00:00Z',
    last_execution_status: 'success',
    settings: {},
    is_active: true,
    created_at: '2024-05-01T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
  },
  {
    id: '2',
    organization_id: 'org-1',
    created_by: null,
    name: 'Re-engagement Clientes Inactivos',
    description: 'Secuencia para reactivar clientes que no han interactuado en 30 días',
    status: 'active',
    trigger_type: 'time_based',
    trigger_config: { schedule: '0 9 * * *', timezone: 'America/Mexico_City' },
    steps: [
      { id: 's1', type: 'send_email', config: { template_id: '3', subject: 'Te extrañamos...' }, nextStepId: 's2' },
      { id: 's2', type: 'wait', config: { duration: 7, unit: 'days' }, nextStepId: 's3' },
      { id: 's3', type: 'condition', config: { field: 'email_opened', value: false }, nextStepId: 's4' },
      { id: 's4', type: 'notify', config: { template_id: '4', channel: 'whatsapp' } },
    ],
    total_executions: 450,
    successful_executions: 380,
    failed_executions: 25,
    last_execution_at: '2024-06-10T10:00:00Z',
    last_execution_status: 'success',
    settings: {},
    is_active: true,
    created_at: '2024-04-15T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z',
  },
  {
    id: '3',
    organization_id: 'org-1',
    created_by: null,
    name: 'Seguimiento Post-Compra',
    description: 'Email de agradecimiento y solicitud de reseña después de una compra',
    status: 'paused',
    trigger_type: 'event',
    trigger_config: { eventName: 'purchase_completed' },
    steps: [
      { id: 's1', type: 'send_email', config: { template_id: '5', subject: '¡Gracias por tu compra!' }, nextStepId: 's2' },
      { id: 's2', type: 'wait', config: { duration: 5, unit: 'days' }, nextStepId: 's3' },
      { id: 's3', type: 'send_email', config: { template_id: '6', subject: '¿Qué te pareció?' } },
    ],
    total_executions: 890,
    successful_executions: 850,
    failed_executions: 15,
    last_execution_at: '2024-05-25T10:00:00Z',
    last_execution_status: 'success',
    settings: {},
    is_active: false,
    created_at: '2024-03-20T10:00:00Z',
    updated_at: '2024-05-25T10:00:00Z',
  },
  {
    id: '4',
    organization_id: 'org-1',
    created_by: null,
    name: 'Carrito Abandonado',
    description: 'Recordatorio para usuarios que dejaron productos en el carrito',
    status: 'draft',
    trigger_type: 'event',
    trigger_config: { eventName: 'cart_abandoned' },
    steps: [
      { id: 's1', type: 'wait', config: { duration: 1, unit: 'hours' }, nextStepId: 's2' },
      { id: 's2', type: 'send_email', config: { template_id: '7', subject: '¿Olvidaste algo?' }, nextStepId: 's3' },
      { id: 's3', type: 'wait', config: { duration: 24, unit: 'hours' }, nextStepId: 's4' },
      { id: 's4', type: 'send_email', config: { template_id: '8', subject: 'Última oportunidad: 10% de descuento' } },
    ],
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    last_execution_at: null,
    last_execution_status: null,
    settings: {},
    is_active: false,
    created_at: '2024-06-20T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
  },
]

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-[#71717A]/20 text-[#A1A1AA]' },
  active: { label: 'Activa', color: 'bg-[#00D68F]/20 text-[#00D68F]' },
  paused: { label: 'Pausada', color: 'bg-[#0046E2]/20 text-[#0046E2]' },
  error: { label: 'Error', color: 'bg-[#FF4757]/20 text-[#FF4757]' },
}

export default function AutomationPage() {
  const { toast } = useToast()
  const [automations, setAutomations] = useState<MarketingAutomation[]>(demoAutomations)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState<MarketingAutomation | null>(null)

  const accentColor = "#FF4757"

  const handleCreate = () => {
    setSelectedAutomation(null)
    setIsBuilderOpen(true)
  }

  const handleEdit = (automation: MarketingAutomation) => {
    setSelectedAutomation(automation)
    setIsBuilderOpen(true)
  }

  const handleSave = (data: Partial<MarketingAutomation>) => {
    if (selectedAutomation) {
      setAutomations(prev => prev.map(a =>
        a.id === selectedAutomation.id
          ? { ...a, ...data, updated_at: new Date().toISOString() }
          : a
      ))
      toast({ title: "Automatización actualizada", description: "Los cambios se han guardado correctamente." })
    } else {
      const newAutomation: MarketingAutomation = {
        id: `demo-${Date.now()}`,
        organization_id: '',
        name: data.name || 'Nueva Automatización',
        description: data.description || '',
        trigger_type: data.trigger_type || 'event',
        trigger_config: data.trigger_config || { eventName: 'contact_created' },
        steps: data.steps || [],
        status: 'draft',
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        last_execution_at: null,
        last_execution_status: null,
        settings: {},
        is_active: false,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setAutomations(prev => [newAutomation, ...prev])
      toast({ title: "Automatización creada", description: "La automatización se ha creado correctamente." })
    }
    setIsBuilderOpen(false)
  }

  const handleDelete = (automationId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta automatización?')) return
    setAutomations(prev => prev.filter(a => a.id !== automationId))
    toast({ title: "Automatización eliminada", description: "La automatización se ha eliminado correctamente." })
  }

  const handleStatusChange = (automationId: string, status: AutomationStatus) => {
    setAutomations(prev => prev.map(a =>
      a.id === automationId ? { ...a, status, updated_at: new Date().toISOString() } : a
    ))
    toast({
      title: "Estado actualizado",
      description: `La automatización ahora está ${status === 'active' ? 'activa' : status === 'paused' ? 'pausada' : status}.`
    })
  }

  if (isBuilderOpen) {
    return (
      <div className="min-h-full bg-[#0f1a4a] p-6">
        <AutomationBuilder
          automation={selectedAutomation}
          accentColor={accentColor}
          onSave={handleSave}
          onCancel={() => setIsBuilderOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0f1a4a] p-6">
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Pulse
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Zap className="h-5 w-5" style={{ color: accentColor }} />
            </div>
            <h1 className="text-2xl font-bold text-white">Automatizaciones</h1>
          </div>
          <p className="text-[#A1A1AA]">Crea flujos de trabajo automatizados para marketing</p>
        </div>
        <Button
          onClick={handleCreate}
          style={{ backgroundColor: accentColor }}
          className="hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Automatización
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-[#243178] rounded-lg p-4 border border-[#2d3c8a]">
          <p className="text-[#A1A1AA] text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{automations.length}</p>
        </div>
        <div className="bg-[#243178] rounded-lg p-4 border border-[#2d3c8a]">
          <p className="text-[#00D68F] text-sm">Activas</p>
          <p className="text-2xl font-bold text-white">
            {automations.filter(a => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-[#243178] rounded-lg p-4 border border-[#2d3c8a]">
          <p className="text-[#A1A1AA] text-sm">Ejecuciones Totales</p>
          <p className="text-2xl font-bold text-white">
            {automations.reduce((sum, a) => sum + (a.total_executions || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#243178] rounded-lg p-4 border border-[#2d3c8a]">
          <p className="text-[#A1A1AA] text-sm">Tasa de Éxito</p>
          <p className="text-2xl font-bold text-white">
            {(() => {
              const total = automations.reduce((sum, a) => sum + (a.total_executions || 0), 0)
              const completed = automations.reduce((sum, a) => sum + (a.successful_executions || 0), 0)
              return total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%'
            })()}
          </p>
        </div>
      </motion.div>

      {/* Automations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {automations.map((automation, index) => {
            const status = statusConfig[automation.status]

            return (
              <motion.div
                key={automation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#243178] rounded-lg border border-[#2d3c8a] p-4 hover:border-[#3A3A3A] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${accentColor}20` }}
                      >
                        <Zap className="h-4 w-4" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{automation.name}</h3>
                        <p className="text-sm text-[#A1A1AA] truncate">
                          {automation.description || 'Sin descripción'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                      <span className="text-xs text-[#A1A1AA]">
                        {automation.steps?.length || 0} pasos
                      </span>
                      <span className="text-xs text-[#A1A1AA]">
                        Trigger: {automation.trigger_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-[#A1A1AA]">Ejecutadas</p>
                      <p className="text-white font-medium">
                        {(automation.total_executions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#A1A1AA]">Completadas</p>
                      <p className="text-white font-medium">
                        {(automation.successful_executions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#A1A1AA]">Fallidas</p>
                      <p className="text-white font-medium">
                        {(automation.failed_executions || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {automation.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(automation.id, 'paused')}
                        className="text-[#0046E2] hover:text-[#0046E2]/80 hover:bg-[#0046E2]/10"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : automation.status !== 'error' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(automation.id, 'active')}
                        className="text-[#00D68F] hover:text-[#00D68F]/80 hover:bg-[#00D68F]/10"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#243178] border-[#2d3c8a]">
                        <DropdownMenuItem
                          onClick={() => handleEdit(automation)}
                          className="text-white hover:bg-[#2d3c8a]"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2d3c8a]" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(automation.id)}
                          className="text-[#FF4757] hover:bg-[#FF4757]/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {automations.length === 0 && (
          <div className="text-center py-12 bg-[#243178] rounded-lg border border-[#2d3c8a]">
            <Zap className="h-12 w-12 mx-auto mb-4 text-[#3A3A3A]" />
            <p className="text-[#A1A1AA]">No hay automatizaciones creadas</p>
            <Button
              onClick={handleCreate}
              className="mt-4"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Automatización
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
