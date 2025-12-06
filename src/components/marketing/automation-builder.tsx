"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus, Trash2, ArrowRight, Mail, Clock, Users, Filter,
  Zap, GitBranch, Play, Pause, Settings, ChevronDown, ChevronUp,
  MousePointer, Eye, ShoppingCart, UserPlus, Calendar, Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { MarketingAutomation } from "@/types/marketing"

// Local types for the builder component
interface AutomationTrigger {
  type: TriggerType
  config: Record<string, any>
}

interface AutomationAction {
  type: ActionType
  config: Record<string, any>
  order: number
}

interface AutomationBuilderProps {
  automation?: MarketingAutomation | null
  accentColor?: string
  onSave: (automation: Partial<MarketingAutomation>) => void
  onCancel: () => void
}

type TriggerType = 'contact_created' | 'tag_added' | 'email_opened' | 'link_clicked' | 'form_submitted' | 'date_based' | 'custom_event'
type ActionType = 'send_email' | 'send_sms' | 'send_whatsapp' | 'add_tag' | 'remove_tag' | 'update_field' | 'wait' | 'condition' | 'webhook'

const triggerTypes: Array<{ id: TriggerType; label: string; icon: typeof UserPlus; description: string }> = [
  { id: 'contact_created', label: 'Nuevo Contacto', icon: UserPlus, description: 'Cuando se crea un nuevo contacto' },
  { id: 'tag_added', label: 'Etiqueta Añadida', icon: Tag, description: 'Cuando se añade una etiqueta específica' },
  { id: 'email_opened', label: 'Email Abierto', icon: Eye, description: 'Cuando se abre un email' },
  { id: 'link_clicked', label: 'Link Clicado', icon: MousePointer, description: 'Cuando se hace clic en un enlace' },
  { id: 'form_submitted', label: 'Formulario Enviado', icon: ShoppingCart, description: 'Cuando se envía un formulario' },
  { id: 'date_based', label: 'Fecha Específica', icon: Calendar, description: 'En una fecha o después de un tiempo' },
  { id: 'custom_event', label: 'Evento Personalizado', icon: Zap, description: 'Evento definido por webhook' },
]

const actionTypes: Array<{ id: ActionType; label: string; icon: typeof Mail; description: string; category: string }> = [
  { id: 'send_email', label: 'Enviar Email', icon: Mail, description: 'Envía un email automatizado', category: 'communication' },
  { id: 'send_sms', label: 'Enviar SMS', icon: Mail, description: 'Envía un mensaje SMS', category: 'communication' },
  { id: 'send_whatsapp', label: 'Enviar WhatsApp', icon: Mail, description: 'Envía un mensaje por WhatsApp', category: 'communication' },
  { id: 'add_tag', label: 'Añadir Etiqueta', icon: Tag, description: 'Añade una etiqueta al contacto', category: 'data' },
  { id: 'remove_tag', label: 'Quitar Etiqueta', icon: Tag, description: 'Elimina una etiqueta del contacto', category: 'data' },
  { id: 'update_field', label: 'Actualizar Campo', icon: Settings, description: 'Actualiza un campo del contacto', category: 'data' },
  { id: 'wait', label: 'Esperar', icon: Clock, description: 'Espera un tiempo antes de continuar', category: 'flow' },
  { id: 'condition', label: 'Condición', icon: GitBranch, description: 'Divide el flujo según condiciones', category: 'flow' },
  { id: 'webhook', label: 'Webhook', icon: Zap, description: 'Llama a un servicio externo', category: 'integration' },
]

export function AutomationBuilder({
  automation,
  accentColor = "#FF6B6B",
  onSave,
  onCancel,
}: AutomationBuilderProps) {
  const [name, setName] = useState(automation?.name || '')
  const [description, setDescription] = useState(automation?.description || '')
  const [trigger, setTrigger] = useState<AutomationTrigger>(
    automation
      ? { type: (automation.trigger_type || 'contact_created') as TriggerType, config: automation.trigger_config || {} }
      : { type: 'contact_created', config: {} }
  )
  const [actions, setActions] = useState<AutomationAction[]>(
    automation?.steps?.map((step, index) => ({
      type: step.type as ActionType,
      config: step.config || {},
      order: index,
    })) || []
  )
  const [showTriggerSelector, setShowTriggerSelector] = useState(false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [expandedAction, setExpandedAction] = useState<number | null>(null)

  const addAction = (type: ActionType) => {
    const newAction: AutomationAction = {
      type,
      config: {},
      order: actions.length,
    }
    setActions([...actions, newAction])
    setShowActionSelector(false)
    setExpandedAction(actions.length)
  }

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...updates }
    setActions(newActions)
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
    setExpandedAction(null)
  }

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === actions.length - 1)
    ) return

    const newActions = [...actions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newActions[index]
    newActions[index] = newActions[newIndex]
    newActions[newIndex] = temp

    newActions.forEach((action, i) => {
      action.order = i
    })

    setActions(newActions)
  }

  const handleSave = () => {
    onSave({
      id: automation?.id,
      name,
      description,
      trigger_type: trigger.type,
      trigger_config: trigger.config,
      steps: actions.map((action, index) => ({
        id: `step-${index}`,
        automation_id: automation?.id || '',
        type: action.type,
        name: actionTypes.find(a => a.id === action.type)?.label || action.type,
        config: action.config,
        order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      status: automation?.status || 'draft',
    } as any)
  }

  const selectedTriggerInfo = triggerTypes.find(t => t.id === trigger.type)
  const TriggerIcon = selectedTriggerInfo?.icon || Zap

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {automation ? 'Editar Automatización' : 'Nueva Automatización'}
          </h2>
          <p className="text-[#A1A1AA]">Configura el flujo de trabajo automatizado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || actions.length === 0}
            style={{ backgroundColor: accentColor }}
          >
            Guardar Automatización
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bienvenida nuevos suscriptores"
              className="mt-2 bg-[#0B0B0B] border-[#2A2A2A] text-white"
            />
          </div>
          <div>
            <Label className="text-white">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué hace esta automatización..."
              className="mt-2 bg-[#0B0B0B] border-[#2A2A2A] text-white"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: accentColor }} />
            Disparador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setShowTriggerSelector(true)}
            className="w-full p-4 rounded-lg border-2 border-dashed border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <TriggerIcon className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {selectedTriggerInfo?.label || 'Seleccionar disparador'}
                </p>
                <p className="text-sm text-[#A1A1AA]">
                  {selectedTriggerInfo?.description || 'Elige qué inicia esta automatización'}
                </p>
              </div>
            </div>
          </button>

          {/* Trigger Config */}
          {trigger.type === 'tag_added' && (
            <div className="mt-4">
              <Label className="text-white">Etiqueta</Label>
              <Input
                value={trigger.config?.tag_name || ''}
                onChange={(e) => setTrigger({
                  ...trigger,
                  config: { ...trigger.config, tag_name: e.target.value }
                })}
                placeholder="Nombre de la etiqueta"
                className="mt-2 bg-[#0B0B0B] border-[#2A2A2A] text-white"
              />
            </div>
          )}

          {trigger.type === 'date_based' && (
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-white">Tipo de fecha</Label>
                <Select
                  value={trigger.config?.date_type || 'relative'}
                  onValueChange={(v) => setTrigger({
                    ...trigger,
                    config: { ...trigger.config, date_type: v }
                  })}
                >
                  <SelectTrigger className="mt-2 bg-[#0B0B0B] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                    <SelectItem value="relative">Después de X días</SelectItem>
                    <SelectItem value="specific">Fecha específica</SelectItem>
                    <SelectItem value="field">Campo de fecha del contacto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" style={{ color: accentColor }} />
            Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {actions.map((action, index) => {
                const actionInfo = actionTypes.find(a => a.id === action.type)
                const ActionIcon = actionInfo?.icon || Zap
                const isExpanded = expandedAction === index

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative"
                  >
                    {/* Connection line */}
                    {index > 0 && (
                      <div className="absolute -top-3 left-6 w-0.5 h-3 bg-[#3A3A3A]" />
                    )}

                    <div className={`rounded-lg border transition-colors ${
                      isExpanded ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[#2A2A2A] bg-[#0B0B0B]'
                    }`} style={{ '--accent': accentColor } as React.CSSProperties}>
                      {/* Action Header */}
                      <div
                        className="p-3 cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedAction(isExpanded ? null : index)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <ActionIcon className="h-4 w-4" style={{ color: accentColor }} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {index + 1}. {actionInfo?.label}
                            </p>
                            <p className="text-xs text-[#A1A1AA]">
                              {actionInfo?.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveAction(index, 'up')
                            }}
                            disabled={index === 0}
                            className="h-7 w-7 p-0 text-[#A1A1AA] hover:text-white"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveAction(index, 'down')
                            }}
                            disabled={index === actions.length - 1}
                            className="h-7 w-7 p-0 text-[#A1A1AA] hover:text-white"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAction(index)
                            }}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Config */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-[#2A2A2A] pt-3 space-y-3">
                          {action.type === 'send_email' && (
                            <>
                              <div>
                                <Label className="text-white text-sm">Plantilla de Email</Label>
                                <Select
                                  value={action.config?.template_id || ''}
                                  onValueChange={(v) => updateAction(index, {
                                    config: { ...action.config, template_id: v }
                                  })}
                                >
                                  <SelectTrigger className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white">
                                    <SelectValue placeholder="Seleccionar plantilla" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                                    <SelectItem value="welcome">Bienvenida</SelectItem>
                                    <SelectItem value="followup">Seguimiento</SelectItem>
                                    <SelectItem value="promo">Promoción</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-white text-sm">Asunto</Label>
                                <Input
                                  value={action.config?.subject || ''}
                                  onChange={(e) => updateAction(index, {
                                    config: { ...action.config, subject: e.target.value }
                                  })}
                                  placeholder="Asunto del email"
                                  className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                                />
                              </div>
                            </>
                          )}

                          {action.type === 'wait' && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <Label className="text-white text-sm">Duración</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={action.config?.duration || 1}
                                  onChange={(e) => updateAction(index, {
                                    config: { ...action.config, duration: parseInt(e.target.value) }
                                  })}
                                  className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-white text-sm">Unidad</Label>
                                <Select
                                  value={action.config?.unit || 'days'}
                                  onValueChange={(v) => updateAction(index, {
                                    config: { ...action.config, unit: v }
                                  })}
                                >
                                  <SelectTrigger className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                                    <SelectItem value="minutes">Minutos</SelectItem>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Días</SelectItem>
                                    <SelectItem value="weeks">Semanas</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {(action.type === 'add_tag' || action.type === 'remove_tag') && (
                            <div>
                              <Label className="text-white text-sm">Etiqueta</Label>
                              <Input
                                value={action.config?.tag_name || ''}
                                onChange={(e) => updateAction(index, {
                                  config: { ...action.config, tag_name: e.target.value }
                                })}
                                placeholder="Nombre de la etiqueta"
                                className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                              />
                            </div>
                          )}

                          {action.type === 'webhook' && (
                            <div>
                              <Label className="text-white text-sm">URL del Webhook</Label>
                              <Input
                                value={action.config?.url || ''}
                                onChange={(e) => updateAction(index, {
                                  config: { ...action.config, url: e.target.value }
                                })}
                                placeholder="https://..."
                                className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow to next action */}
                    {index < actions.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="h-4 w-4 text-[#3A3A3A] rotate-90" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Add Action Button */}
            <button
              onClick={() => setShowActionSelector(true)}
              className="w-full p-4 rounded-lg border-2 border-dashed border-[#2A2A2A] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors flex items-center justify-center gap-2 text-[#A1A1AA] hover:text-white"
              style={{ '--accent': accentColor } as React.CSSProperties}
            >
              <Plus className="h-4 w-4" />
              Añadir Acción
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Selector Dialog */}
      <Dialog open={showTriggerSelector} onOpenChange={setShowTriggerSelector}>
        <DialogContent className="max-w-lg bg-[#1F1F1F] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Seleccionar Disparador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {triggerTypes.map((t) => {
              const Icon = t.icon
              const isSelected = trigger.type === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTrigger({ type: t.id, config: {} })
                    setShowTriggerSelector(false)
                  }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                  }`}
                  style={{ '--accent': accentColor } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{t.label}</p>
                      <p className="text-xs text-[#A1A1AA]">{t.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Selector Dialog */}
      <Dialog open={showActionSelector} onOpenChange={setShowActionSelector}>
        <DialogContent className="max-w-lg bg-[#1F1F1F] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Añadir Acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {['communication', 'data', 'flow', 'integration'].map((category) => (
              <div key={category}>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wide mb-2">
                  {category === 'communication' && 'Comunicación'}
                  {category === 'data' && 'Datos'}
                  {category === 'flow' && 'Flujo'}
                  {category === 'integration' && 'Integración'}
                </p>
                <div className="grid gap-2">
                  {actionTypes
                    .filter((a) => a.category === category)
                    .map((a) => {
                      const Icon = a.icon
                      return (
                        <button
                          key={a.id}
                          onClick={() => addAction(a.id)}
                          className="p-3 rounded-lg border border-[#2A2A2A] hover:border-[#3A3A3A] text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${accentColor}20` }}
                            >
                              <Icon className="h-4 w-4" style={{ color: accentColor }} />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{a.label}</p>
                              <p className="text-xs text-[#A1A1AA]">{a.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
