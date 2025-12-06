"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search, Filter, Plus, MessageCircle, Check, CheckCheck,
  Clock, Image as ImageIcon, File, Mic, Pin
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { WhatsAppConversation } from "@/types/voice"

interface ConversationsListProps {
  conversations: WhatsAppConversation[]
  selectedId?: string
  accentColor?: string
  onSelect: (conversation: WhatsAppConversation) => void
  onNewConversation?: () => void
}

export function ConversationsList({
  conversations,
  selectedId,
  accentColor = "#25D366",
  onSelect,
  onNewConversation,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact_phone.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ayer'
    } else if (diffDays < 7) {
      return d.toLocaleDateString('es-ES', { weekday: 'short' })
    } else {
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getLastMessagePreview = (conv: WhatsAppConversation) => {
    const convAny = conv as any
    if (!convAny.last_message_type && !conv.last_message_text) return 'Sin mensajes'

    switch (convAny.last_message_type) {
      case 'image':
        return (
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Imagen
          </span>
        )
      case 'document':
        return (
          <span className="flex items-center gap-1">
            <File className="h-3 w-3" /> Documento
          </span>
        )
      case 'audio':
        return (
          <span className="flex items-center gap-1">
            <Mic className="h-3 w-3" /> Audio
          </span>
        )
      default:
        return conv.last_message_text || convAny.last_message_preview || 'Sin mensajes'
    }
  }

  const getStatusIcon = (conv: WhatsAppConversation) => {
    if (!conv.last_message_direction || conv.last_message_direction === 'inbound') return null

    switch ((conv as any).last_message_status) {
      case 'sent':
        return <Check className="h-3 w-3 text-[#A1A1AA]" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-[#A1A1AA]" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
      default:
        return <Clock className="h-3 w-3 text-[#A1A1AA]" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1F1F1F] border-r border-[#2A2A2A]">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          {onNewConversation && (
            <Button
              size="sm"
              onClick={onNewConversation}
              style={{ backgroundColor: accentColor }}
              className="hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
            <Input
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0B0B0B] border-none text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] bg-[#0B0B0B] border-none text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F1F1F] border-[#2A2A2A]">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-[#2A2A2A] flex gap-4 text-sm">
        <div>
          <span className="text-[#A1A1AA]">Activos: </span>
          <span className="text-white font-medium">
            {conversations.filter(c => c.status === 'active').length}
          </span>
        </div>
        <div>
          <span className="text-[#A1A1AA]">Sin leer: </span>
          <span className="font-medium" style={{ color: accentColor }}>
            {conversations.filter(c => c.unread_count > 0).length}
          </span>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="h-12 w-12 text-[#3A3A3A] mb-4" />
            <p className="text-[#A1A1AA]">
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation, index) => {
            const isSelected = conversation.id === selectedId
            const hasUnread = conversation.unread_count > 0

            return (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onSelect(conversation)}
                className={`w-full p-3 flex items-start gap-3 hover:bg-[#2A2A2A]/50 transition-colors ${
                  isSelected ? 'bg-[#2A2A2A]' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.contact_profile_pic || undefined} />
                    <AvatarFallback className="bg-[#2A2A2A] text-white">
                      {getInitials(conversation.contact_name || conversation.contact_phone)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.status === 'active' && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1F1F1F]"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium truncate ${hasUnread ? 'text-white' : 'text-[#E1E1E1]'}`}>
                      {conversation.contact_name || conversation.contact_phone}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-[var(--accent)]' : 'text-[#A1A1AA]'}`} style={{ '--accent': accentColor } as React.CSSProperties}>
                      {formatTime(conversation.last_message_at || conversation.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className={`text-sm truncate flex items-center gap-1 ${hasUnread ? 'text-[#E1E1E1]' : 'text-[#A1A1AA]'}`}>
                      {getStatusIcon(conversation)}
                      {getLastMessagePreview(conversation)}
                    </div>
                    {hasUnread && (
                      <Badge
                        className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs border-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  {(conversation as any).is_pinned && (
                    <Pin className="h-3 w-3 text-[#A1A1AA] mt-1" />
                  )}
                </div>
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
}
