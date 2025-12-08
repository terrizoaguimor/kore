"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { FileText, ArrowLeft, Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TemplateCard } from "@/components/marketing"
import type { MarketingTemplate, MarketingTemplateType } from "@/types/marketing"
import { useToast } from "@/hooks/use-toast"

// Demo templates
const demoTemplates: MarketingTemplate[] = [
  {
    id: '1',
    organization_id: '',
    created_by: null,
    name: 'Bienvenida Nuevos Clientes',
    type: 'email',
    description: 'Email de bienvenida para clientes que acaban de registrarse',
    subject: '¡Bienvenido a KORE! Tu viaje comienza aquí',
    content: `Hola {{nombre}},

¡Bienvenido a la familia KORE! Estamos emocionados de tenerte con nosotros.

Tu cuenta ya está activa y lista para usar. Aquí hay algunas cosas que puedes hacer:

✅ Explorar nuestros servicios
✅ Configurar tu perfil
✅ Conectar con nuestro equipo

Si tienes alguna pregunta, no dudes en contactarnos.

¡Saludos!
Equipo KORE`,
    html_content: null,
    variables: ['nombre', 'email'],
    preview_text: 'Bienvenido a la familia KORE',
    thumbnail_url: null,
    usage_count: 45,
    last_used_at: '2024-06-01T10:00:00Z',
    rating: 4.5,
    category: 'welcome',
    tags: ['bienvenida', 'onboarding'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: '2',
    organization_id: '',
    created_by: null,
    name: 'Promoción Especial',
    type: 'email',
    description: 'Plantilla para promociones y ofertas especiales',
    subject: '🔥 Oferta Exclusiva: {{descuento}}% de descuento',
    content: `Hola {{nombre}},

Tenemos una oferta especial solo para ti.

🎉 {{descuento}}% de DESCUENTO en todos nuestros servicios

Esta oferta es válida hasta el {{fecha_limite}}.

No dejes pasar esta oportunidad.

[VER OFERTA]

¡Saludos!
Equipo KORE`,
    html_content: null,
    variables: ['nombre', 'descuento', 'fecha_limite'],
    preview_text: 'Oferta exclusiva para ti',
    thumbnail_url: null,
    usage_count: 32,
    last_used_at: '2024-06-05T10:00:00Z',
    rating: 4.2,
    category: 'promotional',
    tags: ['promocion', 'ofertas'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-05T10:00:00Z',
    updated_at: '2024-06-05T10:00:00Z',
  },
  {
    id: '3',
    organization_id: '',
    created_by: null,
    name: 'Newsletter Mensual',
    type: 'email',
    description: 'Plantilla para el newsletter informativo mensual',
    subject: 'Novedades de {{mes}} - KORE Newsletter',
    content: `Hola {{nombre}},

Este mes en KORE:

📰 NOTICIAS DESTACADAS
{{noticias}}

📈 ESTADÍSTICAS DEL MES
- Nuevos clientes: {{nuevos_clientes}}
- Proyectos completados: {{proyectos}}

📅 PRÓXIMOS EVENTOS
{{eventos}}

¡Gracias por ser parte de nuestra comunidad!

Equipo KORE`,
    html_content: null,
    variables: ['nombre', 'mes', 'noticias', 'nuevos_clientes', 'proyectos', 'eventos'],
    preview_text: 'Las últimas novedades de KORE',
    thumbnail_url: null,
    usage_count: 12,
    last_used_at: '2024-06-10T10:00:00Z',
    rating: 4.8,
    category: 'newsletter',
    tags: ['newsletter', 'mensual'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-10T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z',
  },
  {
    id: '4',
    organization_id: '',
    created_by: null,
    name: 'Seguimiento de Propuesta',
    type: 'email',
    description: 'Email de seguimiento después de enviar una propuesta',
    subject: 'Seguimiento: Propuesta {{numero_propuesta}}',
    content: `Hola {{nombre}},

Espero que te encuentres bien. Quería dar seguimiento a la propuesta que enviamos el {{fecha_envio}}.

¿Has tenido oportunidad de revisarla? Estaré encantado de resolver cualquier duda que tengas.

Quedamos a tu disposición para una llamada o reunión.

Saludos cordiales,
{{asesor}}
Equipo KORE`,
    html_content: null,
    variables: ['nombre', 'numero_propuesta', 'fecha_envio', 'asesor'],
    preview_text: 'Seguimiento de propuesta',
    thumbnail_url: null,
    usage_count: 28,
    last_used_at: '2024-06-15T10:00:00Z',
    rating: 4.0,
    category: 'followup',
    tags: ['seguimiento', 'propuestas'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
  },
  {
    id: '5',
    organization_id: '',
    created_by: null,
    name: 'Mensaje SMS - Bienvenida',
    type: 'sms',
    description: 'Mensaje de bienvenida para SMS',
    subject: null,
    content: `¡Hola {{nombre}}! Bienvenido/a a KORE. Tu cuenta está activa. Visita kore.com para más info.`,
    html_content: null,
    variables: ['nombre'],
    preview_text: null,
    thumbnail_url: null,
    usage_count: 15,
    last_used_at: '2024-06-20T10:00:00Z',
    rating: 4.3,
    category: 'welcome',
    tags: ['sms', 'bienvenida'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-20T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
  },
  {
    id: '6',
    organization_id: '',
    created_by: null,
    name: 'Post Redes Sociales - Promoción',
    type: 'social_post',
    description: 'Plantilla para posts promocionales en redes sociales',
    subject: null,
    content: `🚀 {{titulo}}

{{descripcion}}

✅ {{beneficio_1}}
✅ {{beneficio_2}}
✅ {{beneficio_3}}

👉 {{call_to_action}}

#KORE #Marketing #{{hashtag}}`,
    html_content: null,
    variables: ['titulo', 'descripcion', 'beneficio_1', 'beneficio_2', 'beneficio_3', 'call_to_action', 'hashtag'],
    preview_text: null,
    thumbnail_url: null,
    usage_count: 8,
    last_used_at: '2024-06-25T10:00:00Z',
    rating: 4.1,
    category: 'promotional',
    tags: ['redes-sociales', 'promocion'],
    is_active: true,
    is_default: false,
    created_at: '2024-06-25T10:00:00Z',
    updated_at: '2024-06-25T10:00:00Z',
  },
]

export default function TemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<MarketingTemplate[]>(demoTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MarketingTemplate | null>(null)

  const accentColor = "#FF4757"

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email' as MarketingTemplateType,
    category: 'welcome',
    subject: '',
    body: '',
  })

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || template.type === typeFilter
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      type: 'email',
      category: 'welcome',
      subject: '',
      body: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (template: MarketingTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      category: template.category || '',
      subject: template.subject || '',
      body: template.content || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const newTemplate: MarketingTemplate = {
      id: editingTemplate?.id || `demo-${Date.now()}`,
      organization_id: '',
      created_by: null,
      name: formData.name,
      type: formData.type,
      description: formData.description,
      subject: formData.type === 'email' ? formData.subject : null,
      content: formData.body,
      html_content: null,
      variables: extractVariables(formData.body + (formData.subject || '')),
      preview_text: null,
      thumbnail_url: null,
      usage_count: editingTemplate?.usage_count || 0,
      last_used_at: null,
      rating: editingTemplate?.rating || 0,
      category: formData.category,
      tags: editingTemplate?.tags || [],
      is_active: true,
      is_default: false,
      created_at: editingTemplate?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? newTemplate : t))
      toast({ title: "Plantilla actualizada", description: "Los cambios se han guardado correctamente." })
    } else {
      setTemplates(prev => [newTemplate, ...prev])
      toast({ title: "Plantilla creada", description: "La plantilla se ha creado correctamente." })
    }

    setDialogOpen(false)
  }

  const handleDelete = (templateId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) return
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    toast({ title: "Plantilla eliminada", description: "La plantilla se ha eliminado correctamente." })
  }

  const handleDuplicate = (template: MarketingTemplate) => {
    const newTemplate: MarketingTemplate = {
      ...template,
      id: `demo-${Date.now()}`,
      name: `${template.name} (copia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTemplates(prev => [newTemplate, ...prev])
    toast({ title: "Plantilla duplicada", description: "Se ha creado una copia de la plantilla." })
  }

  const handleUse = (template: MarketingTemplate) => {
    toast({
      title: "Plantilla seleccionada",
      description: `La plantilla "${template.name}" está lista para usar en una campaña.`,
    })
  }

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
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
              <FileText className="h-5 w-5" style={{ color: accentColor }} />
            </div>
            <h1 className="text-2xl font-bold text-white">Plantillas de Marketing</h1>
          </div>
          <p className="text-[#A1A1AA]">Crea y gestiona plantillas reutilizables</p>
        </div>
        <Button
          onClick={handleCreate}
          style={{ backgroundColor: accentColor }}
          className="hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <Input
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1F1F1F] border-[#2A2A2A] text-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="social">Redes Sociales</SelectItem>
            <SelectItem value="landing">Landing Page</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="welcome">Bienvenida</SelectItem>
            <SelectItem value="promotional">Promocional</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="transactional">Transaccional</SelectItem>
            <SelectItem value="followup">Seguimiento</SelectItem>
            <SelectItem value="announcement">Anuncio</SelectItem>
            <SelectItem value="survey">Encuesta</SelectItem>
            <SelectItem value="event">Evento</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <TemplateCard
              template={template}
              accentColor={accentColor}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onUse={handleUse}
            />
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <FileText className="h-12 w-12 mx-auto mb-4 text-[#3A3A3A]" />
          <p className="text-[#A1A1AA]">No se encontraron plantillas</p>
          <Button
            onClick={handleCreate}
            className="mt-4"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Plantilla
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#1F1F1F] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la plantilla"
                  className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                />
              </div>
              <div>
                <Label className="text-white">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as MarketingTemplateType }))}
                >
                  <SelectTrigger className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="social">Redes Sociales</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
                    <SelectItem value="welcome">Bienvenida</SelectItem>
                    <SelectItem value="promotional">Promocional</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="transactional">Transaccional</SelectItem>
                    <SelectItem value="followup">Seguimiento</SelectItem>
                    <SelectItem value="announcement">Anuncio</SelectItem>
                    <SelectItem value="survey">Encuesta</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción breve"
                  className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                />
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <Label className="text-white">Asunto</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Asunto del email"
                  className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white"
                />
              </div>
            )}

            <div>
              <Label className="text-white">Contenido *</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Contenido de la plantilla. Usa {{variable}} para variables dinámicas."
                className="mt-1 bg-[#0B0B0B] border-[#2A2A2A] text-white min-h-[200px]"
              />
              <p className="text-xs text-[#A1A1AA] mt-1">
                Variables detectadas: {extractVariables(formData.body + formData.subject).join(', ') || 'ninguna'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.body}
              style={{ backgroundColor: accentColor }}
            >
              {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
