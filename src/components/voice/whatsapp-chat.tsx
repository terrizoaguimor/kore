"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Send, Paperclip, Smile, MoreVertical, Phone, Video,
  Check, CheckCheck, Clock, Image as ImageIcon, File,
  Mic, X, Search, ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WhatsAppConversation, WhatsAppMessage } from "@/types/voice"

interface WhatsAppChatProps {
  conversation: WhatsAppConversation | null
  messages: WhatsAppMessage[]
  accentColor?: string
  onSendMessage: (content: string, messageType?: 'text' | 'image' | 'document') => void
  onBack?: () => void
}

export function WhatsAppChat({
  conversation,
  messages,
  accentColor = "#25D366",
  onSendMessage,
  onBack,
}: WhatsAppChatProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return
    onSendMessage(newMessage.trim())
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Hoy'
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0B0B]">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Phone className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <p className="text-[#A1A1AA]">Selecciona una conversación para comenzar</p>
        </div>
      </div>
    )
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: WhatsAppMessage[] }[] = []
  let currentDate = ''
  messages.forEach((msg) => {
    const msgDate = formatDate(msg.created_at)
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msgDate, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#1F1F1F]">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="lg:hidden text-[#A1A1AA] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar>
            <AvatarImage src={conversation.contact_profile_pic || undefined} />
            <AvatarFallback className="bg-[#2A2A2A] text-white">
              {getInitials(conversation.contact_name || conversation.contact_phone)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">
              {conversation.contact_name || conversation.contact_phone}
            </p>
            <p className="text-xs text-[#A1A1AA]">
              {conversation.status === 'active' ? 'En línea' : 'Desconectado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
            <Search className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1F1F1F] border-[#2A2A2A]">
              <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                Buscar en chat
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-[#2A2A2A]">
                Silenciar notificaciones
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                Cerrar conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0L60 30L30 60L0 30L30 0z" fill="%231F1F1F" fill-opacity="0.3"/%3E%3C/svg%3E")',
          backgroundSize: '30px 30px',
        }}
      >
        <AnimatePresence>
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 rounded-lg bg-[#1F1F1F]/80 text-xs text-[#A1A1AA]">
                  {group.date}
                </span>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message, msgIndex) => {
                const isOutbound = message.direction === 'outbound'

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: msgIndex * 0.02 }}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isOutbound
                          ? 'bg-[#005C4B] rounded-tr-none'
                          : 'bg-[#1F1F1F] rounded-tl-none'
                      }`}
                    >
                      {/* Message content based on type */}
                      {message.message_type === 'image' && (
                        <div className="mb-1">
                          <div className="bg-[#0B0B0B] rounded-lg p-8 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-[#A1A1AA]" />
                          </div>
                          {message.media_caption && (
                            <p className="text-sm text-white mt-2">{message.media_caption}</p>
                          )}
                        </div>
                      )}

                      {message.message_type === 'document' && (
                        <div className="flex items-center gap-3 mb-1 bg-[#0B0B0B] rounded-lg p-3">
                          <File className="h-8 w-8 text-[#A1A1AA]" />
                          <div>
                            <p className="text-sm text-white">{message.media_filename || 'Documento'}</p>
                            <p className="text-xs text-[#A1A1AA]">PDF</p>
                          </div>
                        </div>
                      )}

                      {message.message_type === 'text' && (
                        <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                      )}

                      {/* Time and status */}
                      <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-[#A1A1AA]">
                          {formatTime(message.created_at)}
                        </span>
                        {isOutbound && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-[#1F1F1F] rounded-lg px-4 py-2 rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
            <Smile className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-white">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-[#0B0B0B] border-none text-white placeholder:text-[#A1A1AA]"
          />
          {newMessage.trim() ? (
            <Button
              onClick={handleSend}
              size="sm"
              className="h-10 w-10 rounded-full p-0"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 text-[#A1A1AA] hover:text-white"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
