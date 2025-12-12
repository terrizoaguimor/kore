"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { MarketingCampaign, MarketingCampaignInsert, MarketingCampaignType, MarketingCampaignStatus } from "@/types/marketing"

interface CampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: MarketingCampaign | null
  onSave: (campaign: MarketingCampaignInsert) => Promise<void>
}

const campaignTypes: Array<{ value: MarketingCampaignType; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'social_media', label: 'Redes Sociales' },
  { value: 'direct_mail', label: 'Correo Directo' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'web', label: 'Web' },
  { value: 'multi_channel', label: 'Multicanal' },
]

const campaignStatuses: Array<{ value: MarketingCampaignStatus; label: string }> = [
  { value: 'draft', label: 'Borrador' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'active', label: 'Activa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

export function CampaignDialog({ open, onOpenChange, campaign, onSave }: CampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<MarketingCampaign>>({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
    budget: 0,
    goals: { leads: 0, conversions: 0, revenue: 0 },
    target_audience: {},
    content: { subject: '', body: '' },
  })
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  useEffect(() => {
    if (campaign) {
      setFormData({
        ...campaign,
      })
      setStartDate(campaign.start_date ? new Date(campaign.start_date) : undefined)
      setEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined)
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'email',
        status: 'draft',
        budget: 0,
        goals: { leads: 0, conversions: 0, revenue: 0 },
        target_audience: {},
        content: { subject: '', body: '' },
      })
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }, [campaign, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSave({
        ...formData as MarketingCampaignInsert,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving campaign:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedData = (parent: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent as keyof typeof prev] as Record<string, unknown> || {}), [field]: value }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#1F1F1F] border-[#2A2A2A] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="bg-[#2A2A2A] w-full justify-start">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="audience">Audiencia</TabsTrigger>
              <TabsTrigger value="goals">Metas</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre de la Campaña *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Mi campaña de marketing"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Describe el objetivo de esta campaña..."
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tipo de Campaña *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateFormData('type', value)}
                  >
                    <SelectTrigger className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <SelectTrigger className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                      {campaignStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full justify-start text-left font-normal bg-[#0f1a4a] border-[#2A2A2A]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1F1F1F] border-[#2A2A2A]">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full justify-start text-left font-normal bg-[#0f1a4a] border-[#2A2A2A]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1F1F1F] border-[#2A2A2A]">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Presupuesto ($)</Label>
                  <Input
                    type="number"
                    value={formData.budget || 0}
                    onChange={(e) => updateFormData('budget', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-4">
                {(formData.type === 'email' || formData.type === 'multi_channel') && (
                  <div>
                    <Label>Asunto del Email</Label>
                    <Input
                      value={(formData.content as Record<string, string>)?.subject || ''}
                      onChange={(e) => updateNestedData('content', 'subject', e.target.value)}
                      placeholder="Asunto de tu email..."
                      className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    />
                  </div>
                )}

                <div>
                  <Label>Contenido del Mensaje</Label>
                  <Textarea
                    value={(formData.content as Record<string, string>)?.body || ''}
                    onChange={(e) => updateNestedData('content', 'body', e.target.value)}
                    placeholder="Escribe el contenido de tu campaña..."
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    rows={10}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Edad Mínima</Label>
                  <Input
                    type="number"
                    value={((formData.target_audience as any)?.ageRange as any)?.min || ''}
                    onChange={(e) => updateNestedData('target_audience', 'ageRange', {
                      ...((formData.target_audience as any)?.ageRange || {}),
                      min: parseInt(e.target.value) || undefined
                    })}
                    placeholder="18"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                  />
                </div>

                <div>
                  <Label>Edad Máxima</Label>
                  <Input
                    type="number"
                    value={((formData.target_audience as any)?.ageRange as any)?.max || ''}
                    onChange={(e) => updateNestedData('target_audience', 'ageRange', {
                      ...((formData.target_audience as any)?.ageRange || {}),
                      max: parseInt(e.target.value) || undefined
                    })}
                    placeholder="65"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Ubicaciones (separadas por coma)</Label>
                  <Input
                    value={((formData.target_audience as any)?.location as string[])?.join(', ') || ''}
                    onChange={(e) => updateNestedData('target_audience', 'location',
                      e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    )}
                    placeholder="Miami, New York, Los Angeles"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Intereses (separados por coma)</Label>
                  <Input
                    value={((formData.target_audience as Record<string, unknown>)?.interests as string[])?.join(', ') || ''}
                    onChange={(e) => updateNestedData('target_audience', 'interests',
                      e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    )}
                    placeholder="tecnología, finanzas, salud"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                  />
                </div>

                <div>
                  <Label>Tipo de Cliente</Label>
                  <Select
                    value={(formData.target_audience as Record<string, unknown>)?.customerType as string || ''}
                    onValueChange={(value) => updateNestedData('target_audience', 'customerType', value)}
                  >
                    <SelectTrigger className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                      <SelectItem value="new">Nuevos</SelectItem>
                      <SelectItem value="existing">Existentes</SelectItem>
                      <SelectItem value="lapsed">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Meta de Leads</Label>
                  <Input
                    type="number"
                    value={(formData.goals as any)?.leads || 0}
                    onChange={(e) => updateNestedData('goals', 'leads', parseInt(e.target.value) || 0)}
                    placeholder="100"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                  />
                </div>

                <div>
                  <Label>Meta de Conversiones</Label>
                  <Input
                    type="number"
                    value={(formData.goals as any)?.conversions || 0}
                    onChange={(e) => updateNestedData('goals', 'conversions', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                  />
                </div>

                <div>
                  <Label>Meta de Ingresos ($)</Label>
                  <Input
                    type="number"
                    value={(formData.goals as any)?.revenue || 0}
                    onChange={(e) => updateNestedData('goals', 'revenue', parseFloat(e.target.value) || 0)}
                    placeholder="10000"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                    step={0.01}
                  />
                </div>

                <div>
                  <Label>Meta Tasa Apertura (%)</Label>
                  <Input
                    type="number"
                    value={(formData.goals as any)?.openRate || 0}
                    onChange={(e) => updateNestedData('goals', 'openRate', parseFloat(e.target.value) || 0)}
                    placeholder="25"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label>Meta Tasa Click (%)</Label>
                  <Input
                    type="number"
                    value={(formData.goals as any)?.clickRate || 0}
                    onChange={(e) => updateNestedData('goals', 'clickRate', parseFloat(e.target.value) || 0)}
                    placeholder="5"
                    className="mt-2 bg-[#0f1a4a] border-[#2A2A2A]"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#2A2A2A]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2A2A2A]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : campaign ? (
                'Actualizar Campaña'
              ) : (
                'Crear Campaña'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
