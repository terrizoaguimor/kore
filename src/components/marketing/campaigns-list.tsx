"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus, Search, Filter, MoreHorizontal, Play, Pause, Pencil, Trash2,
  Mail, MessageSquare, Globe, BarChart3, Users, Calendar, TrendingUp,
  ChevronDown, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MarketingCampaign, MarketingCampaignStatus, MarketingCampaignType } from "@/types/marketing"

interface CampaignsListProps {
  campaigns: MarketingCampaign[]
  isLoading?: boolean
  accentColor?: string
  onCreateCampaign: () => void
  onEditCampaign: (campaign: MarketingCampaign) => void
  onDeleteCampaign: (campaignId: string) => void
  onViewAnalytics: (campaignId: string) => void
  onStatusChange: (campaignId: string, status: MarketingCampaignStatus) => void
}

const statusConfig: Record<MarketingCampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Borrador', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  scheduled: { label: 'Programada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  active: { label: 'Activa', color: 'text-green-400', bg: 'bg-green-500/20' },
  paused: { label: 'Pausada', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  completed: { label: 'Completada', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' },
}

const typeConfig: Record<MarketingCampaignType, { label: string; icon: typeof Mail }> = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  social_media: { label: 'Redes Sociales', icon: Globe },
  direct_mail: { label: 'Correo Directo', icon: Mail },
  phone: { label: 'Telefónico', icon: MessageSquare },
  web: { label: 'Web', icon: Globe },
  multi_channel: { label: 'Multi-canal', icon: Globe },
}

export function CampaignsList({
  campaigns,
  isLoading = false,
  accentColor = "#FF6B6B",
  onCreateCampaign,
  onEditCampaign,
  onDeleteCampaign,
  onViewAnalytics,
  onStatusChange,
}: CampaignsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesType = typeFilter === "all" || campaign.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Campañas</h2>
          <p className="text-[#A1A1AA]">Gestiona tus campañas de marketing</p>
        </div>
        <Button
          onClick={onCreateCampaign}
          style={{ backgroundColor: accentColor }}
          className="hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <Input
            placeholder="Buscar campañas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1F1F1F] border-[#2A2A2A] text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(typeConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Total Campañas</span>
          </div>
          <p className="text-2xl font-bold text-white">{campaigns.length}</p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Play className="h-4 w-4" />
            <span className="text-sm">Activas</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Enviados</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0))}
          </p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Tasa Apertura</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(() => {
              const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0)
              const totalOpened = campaigns.reduce((sum, c) => sum + (c.metrics?.opened || 0), 0)
              return totalSent > 0 ? `${((totalOpened / totalSent) * 100).toFixed(1)}%` : '0%'
            })()}
          </p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accentColor }} />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#3A3A3A]" />
            <p className="text-[#A1A1AA]">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No se encontraron campañas con esos filtros"
                : "No hay campañas creadas"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Button
                onClick={onCreateCampaign}
                className="mt-4"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Campaña
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredCampaigns.map((campaign, index) => {
              const statusInfo = statusConfig[campaign.status]
              const typeInfo = typeConfig[campaign.type]
              const TypeIcon = typeInfo.icon
              const openRate = campaign.metrics?.sent
                ? ((campaign.metrics.opened || 0) / campaign.metrics.sent * 100).toFixed(1)
                : '0'
              const clickRate = campaign.metrics?.opened
                ? ((campaign.metrics.clicked || 0) / campaign.metrics.opened * 100).toFixed(1)
                : '0'

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1F1F1F] rounded-lg border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Campaign Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${accentColor}20` }}
                        >
                          <TypeIcon className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-medium truncate">{campaign.name}</h3>
                          <p className="text-sm text-[#A1A1AA] truncate">
                            {campaign.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-[#A1A1AA]">
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-[#A1A1AA] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(campaign.start_date)}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-[#A1A1AA]">Enviados</p>
                        <p className="text-white font-medium">
                          {formatNumber(campaign.metrics?.sent || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#A1A1AA]">Apertura</p>
                        <p className="text-white font-medium">{openRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#A1A1AA]">Clicks</p>
                        <p className="text-white font-medium">{clickRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#A1A1AA]">Leads</p>
                        <p className="text-white font-medium">
                          {formatNumber(campaign.metrics?.leads || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {campaign.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(campaign.id, 'paused')}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(campaign.id, 'active')}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAnalytics(campaign.id)}
                        className="text-[#A1A1AA] hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1F1F1F] border-[#2A2A2A]">
                          <DropdownMenuItem
                            onClick={() => onEditCampaign(campaign)}
                            className="text-white hover:bg-[#2A2A2A]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onViewAnalytics(campaign.id)}
                            className="text-white hover:bg-[#2A2A2A]"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Ver Analíticas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                          <DropdownMenuItem
                            onClick={() => onDeleteCampaign(campaign.id)}
                            className="text-red-400 hover:bg-red-500/10"
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
        )}
      </div>
    </div>
  )
}
