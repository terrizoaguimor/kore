"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff,
  Clock, User, Play, Pause, Volume2, MoreHorizontal, Search,
  Filter, Download, FileText, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { VoiceCallLog } from "@/types/voice"

interface CallLogsProps {
  calls: VoiceCallLog[]
  isLoading?: boolean
  accentColor?: string
  onCallBack?: (phoneNumber: string) => void
  onViewDetails?: (call: VoiceCallLog) => void
}

const directionConfig = {
  inbound: { label: 'Entrante', icon: PhoneIncoming, color: 'text-blue-400' },
  outbound: { label: 'Saliente', icon: PhoneOutgoing, color: 'text-green-400' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ringing: { label: 'Sonando', color: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: 'En progreso', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completada', color: 'bg-green-500/20 text-green-400' },
  missed: { label: 'Perdida', color: 'bg-red-500/20 text-red-400' },
  voicemail: { label: 'Buzón de voz', color: 'bg-yellow-500/20 text-yellow-400' },
  failed: { label: 'Fallida', color: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-500/20 text-gray-400' },
}

export function CallLogs({
  calls,
  isLoading = false,
  accentColor = "#10B981",
  onCallBack,
  onViewDetails,
}: CallLogsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [directionFilter, setDirectionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCall, setSelectedCall] = useState<VoiceCallLog | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const filteredCalls = calls.filter((call) => {
    const callAny = call as any
    const matchesSearch =
      callAny.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.from_number.includes(searchQuery) ||
      call.to_number.includes(searchQuery)
    const matchesDirection = directionFilter === "all" || call.direction === directionFilter
    const matchesStatus = statusFilter === "all" || call.status === statusFilter
    return matchesSearch && matchesDirection && matchesStatus
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return `Hoy ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Ayer ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Stats
  const totalCalls = calls.length
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const missedCalls = calls.filter(c => c.status === 'missed').length
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0)
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <Phone className="h-4 w-4" />
            <span className="text-sm">Total Llamadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalCalls}</p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <PhoneIncoming className="h-4 w-4" />
            <span className="text-sm">Completadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedCalls}</p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <PhoneMissed className="h-4 w-4" />
            <span className="text-sm">Perdidas</span>
          </div>
          <p className="text-2xl font-bold text-white">{missedCalls}</p>
        </div>
        <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Duración Promedio</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatDuration(avgDuration)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <Input
            placeholder="Buscar por nombre o número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1F1F1F] border-[#2A2A2A] text-white"
          />
        </div>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Dirección" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="inbound">Entrantes</SelectItem>
            <SelectItem value="outbound">Salientes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-[#1F1F1F] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="missed">Perdidas</SelectItem>
            <SelectItem value="voicemail">Buzón de voz</SelectItem>
            <SelectItem value="no_answer">Sin respuesta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Call List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accentColor }} />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
            <Phone className="h-12 w-12 mx-auto mb-4 text-[#3A3A3A]" />
            <p className="text-[#A1A1AA]">No se encontraron llamadas</p>
          </div>
        ) : (
          filteredCalls.map((call, index) => {
            const direction = directionConfig[call.direction]
            const status = statusConfig[call.status]
            const DirectionIcon = direction.icon

            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-[#1F1F1F] rounded-lg border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors cursor-pointer"
                onClick={() => setSelectedCall(call)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar & Direction */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={(call as any).contact_avatar_url || undefined} />
                      <AvatarFallback className="bg-[#2A2A2A] text-white">
                        {(call as any).contact_name ? getInitials((call as any).contact_name) : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-[#1F1F1F] ${direction.color}`}>
                      <DirectionIcon className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {(call as any).contact_name || (call.direction === 'inbound' ? call.from_number : call.to_number)}
                      </span>
                      <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#A1A1AA] mt-1">
                      <span>{call.direction === 'inbound' ? call.from_number : call.to_number}</span>
                      {call.duration_seconds && call.duration_seconds > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration_seconds)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time & Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#A1A1AA]">{call.started_at ? formatDate(call.started_at) : '-'}</span>
                    <div className="flex items-center gap-1">
                      {call.recording_url && (
                        <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onCallBack && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCallBack(call.direction === 'inbound' ? call.from_number : call.to_number)
                          }}
                          style={{ color: accentColor }}
                          className="hover:bg-[var(--accent)]/10"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#A1A1AA] hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1F1F1F] border-[#2A2A2A]">
                          <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                            <User className="mr-2 h-4 w-4" />
                            Ver contacto
                          </DropdownMenuItem>
                          {call.recording_url && (
                            <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                              <Download className="mr-2 h-4 w-4" />
                              Descargar grabación
                            </DropdownMenuItem>
                          )}
                          {call.transcription && (
                            <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                              <FileText className="mr-2 h-4 w-4" />
                              Ver transcripción
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Call Details Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-lg bg-[#1F1F1F] border-[#2A2A2A]">
          {selectedCall && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Phone className="h-5 w-5" style={{ color: accentColor }} />
                  Detalles de la llamada
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="flex items-center gap-4 p-4 bg-[#0B0B0B] rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-[#2A2A2A] text-white text-xl">
                      {(selectedCall as any).contact_name ? getInitials((selectedCall as any).contact_name) : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-medium text-white">
                      {(selectedCall as any).contact_name || 'Desconocido'}
                    </p>
                    <p className="text-[#A1A1AA]">
                      {selectedCall.direction === 'inbound' ? selectedCall.from_number : selectedCall.to_number}
                    </p>
                  </div>
                </div>

                {/* Call Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Dirección</p>
                    <p className="text-white">{directionConfig[selectedCall.direction].label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Estado</p>
                    <Badge className={`${statusConfig[selectedCall.status].color} border-0`}>
                      {statusConfig[selectedCall.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Duración</p>
                    <p className="text-white">{selectedCall.duration_seconds ? formatDuration(selectedCall.duration_seconds) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Fecha</p>
                    <p className="text-white">{selectedCall.started_at ? formatDate(selectedCall.started_at) : '-'}</p>
                  </div>
                </div>

                {/* Recording */}
                {selectedCall.recording_url && (
                  <div className="p-4 bg-[#0B0B0B] rounded-lg">
                    <p className="text-xs text-[#A1A1AA] mb-2">Grabación</p>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full">
                        <div className="h-full w-1/3 rounded-full" style={{ backgroundColor: accentColor }} />
                      </div>
                      <span className="text-xs text-[#A1A1AA]">{formatDuration(selectedCall.duration_seconds || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Transcription */}
                {selectedCall.transcription && (
                  <div>
                    <p className="text-xs text-[#A1A1AA] mb-2">Transcripción</p>
                    <div className="p-4 bg-[#0B0B0B] rounded-lg max-h-40 overflow-y-auto">
                      <p className="text-sm text-[#E1E1E1] whitespace-pre-wrap">{selectedCall.transcription}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-[#2A2A2A]">
                  <Button variant="outline" onClick={() => setSelectedCall(null)}>
                    Cerrar
                  </Button>
                  {onCallBack && (
                    <Button
                      onClick={() => {
                        onCallBack(selectedCall.direction === 'inbound' ? selectedCall.from_number : selectedCall.to_number)
                        setSelectedCall(null)
                      }}
                      style={{ backgroundColor: accentColor }}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Llamar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
