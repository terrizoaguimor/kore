"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Mail, MessageSquare, Globe, FileText, Copy, Pencil, Trash2,
  MoreHorizontal, Eye, Star, StarOff, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MarketingTemplate, MarketingTemplateType } from "@/types/marketing"

interface TemplateCardProps {
  template: MarketingTemplate
  accentColor?: string
  onEdit: (template: MarketingTemplate) => void
  onDelete: (templateId: string) => void
  onDuplicate: (template: MarketingTemplate) => void
  onUse: (template: MarketingTemplate) => void
  onToggleFavorite?: (templateId: string, isFavorite: boolean) => void
}

const typeConfig: Record<MarketingTemplateType, { label: string; icon: typeof Mail }> = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  social_post: { label: 'Redes Sociales', icon: Globe },
  landing_page: { label: 'Landing Page', icon: FileText },
  ad_copy: { label: 'Anuncio', icon: FileText },
  blog_post: { label: 'Blog', icon: FileText },
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  welcome: { label: 'Bienvenida', color: 'bg-blue-500/20 text-blue-400' },
  promotional: { label: 'Promocional', color: 'bg-green-500/20 text-green-400' },
  newsletter: { label: 'Newsletter', color: 'bg-purple-500/20 text-purple-400' },
  transactional: { label: 'Transaccional', color: 'bg-yellow-500/20 text-yellow-400' },
  followup: { label: 'Seguimiento', color: 'bg-orange-500/20 text-orange-400' },
  announcement: { label: 'Anuncio', color: 'bg-pink-500/20 text-pink-400' },
  survey: { label: 'Encuesta', color: 'bg-teal-500/20 text-teal-400' },
  event: { label: 'Evento', color: 'bg-indigo-500/20 text-indigo-400' },
}

export function TemplateCard({
  template,
  accentColor = "#FF6B6B",
  onEdit,
  onDelete,
  onDuplicate,
  onUse,
  onToggleFavorite,
}: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const typeInfo = typeConfig[template.type]
  const categoryInfo = template.category ? categoryConfig[template.category] : null
  const TypeIcon = typeInfo?.icon || Mail

  const copyContent = async () => {
    await navigator.clipboard.writeText(template.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group bg-[#1F1F1F] rounded-lg border border-[#2A2A2A] overflow-hidden hover:border-[#3A3A3A] transition-all"
      >
        {/* Preview Area */}
        <div
          className="relative h-40 bg-[#0B0B0B] p-4 cursor-pointer"
          onClick={() => setShowPreview(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1F1F1F]/80" />
          <div className="relative h-full overflow-hidden">
            {template.subject && (
              <p className="text-sm font-medium text-white mb-2 truncate">
                {template.subject}
              </p>
            )}
            <p className="text-xs text-[#A1A1AA] line-clamp-4 whitespace-pre-wrap">
              {template.content || 'Sin contenido'}
            </p>
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white">
              <Eye className="mr-2 h-4 w-4" />
              Vista Previa
            </Button>
          </div>

          {/* Favorite Star */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(template.id, !template.is_active)
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            >
              {template.is_active ? (
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4 text-[#A1A1AA]" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{template.name}</h3>
              <p className="text-sm text-[#A1A1AA] truncate">
                {template.description || 'Sin descripción'}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              <TypeIcon className="h-3 w-3" />
              {typeInfo.label}
            </div>
            {categoryInfo && (
              <Badge className={`${categoryInfo.color} border-0 text-xs`}>
                {categoryInfo.label}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              onClick={() => onUse(template)}
              style={{ backgroundColor: accentColor }}
              className="hover:opacity-90"
            >
              Usar Plantilla
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyContent}
                className="text-[#A1A1AA] hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1F1F1F] border-[#2A2A2A]">
                  <DropdownMenuItem
                    onClick={() => onEdit(template)}
                    className="text-white hover:bg-[#2A2A2A]"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDuplicate(template)}
                    className="text-white hover:bg-[#2A2A2A]"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                  <DropdownMenuItem
                    onClick={() => onDelete(template.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl bg-[#1F1F1F] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TypeIcon className="h-5 w-5" style={{ color: accentColor }} />
              {template.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {template.subject && (
              <div>
                <p className="text-xs text-[#A1A1AA] mb-1">Asunto</p>
                <p className="text-white font-medium">{template.subject}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#A1A1AA] mb-1">Contenido</p>
              <div className="bg-[#0B0B0B] rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-[#E1E1E1] font-sans">
                  {template.content || 'Sin contenido'}
                </pre>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                {categoryInfo && <Badge className={`${categoryInfo.color} border-0`}>{categoryInfo.label}</Badge>}
                <span className="text-xs text-[#A1A1AA]">
                  Creada: {new Date(template.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    onUse(template)
                    setShowPreview(false)
                  }}
                  style={{ backgroundColor: accentColor }}
                >
                  Usar Plantilla
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
