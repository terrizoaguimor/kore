"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { MessageCircle, ArrowLeft } from "lucide-react"
import { ConversationsList, WhatsAppChat } from "@/components/voice"
import type { WhatsAppConversation, WhatsAppMessage } from "@/types/voice"
import { useToast } from "@/hooks/use-toast"

// Demo conversations (type assertion due to legacy mock data structure)
const demoConversations = [
  {
    id: '1',
    organization_id: '',
    whatsapp_account_id: '',
    contact_phone: '+52 (55) 1234-5678',
    contact_name: 'Juan Pérez',
    contact_avatar_url: null,
    status: 'active',
    is_pinned: true,
    unread_count: 2,
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    last_message_preview: 'Gracias por la información',
    last_message_type: 'text',
    last_message_direction: 'inbound',
    last_message_status: 'delivered',
    window_expires_at: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    assigned_to: null,
    tags: [],
    created_at: '2024-06-01T10:00:00Z',
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    organization_id: '',
    whatsapp_account_id: '',
    contact_phone: '+52 (55) 9876-5432',
    contact_name: 'Ana Martínez',
    contact_avatar_url: null,
    status: 'active',
    is_pinned: false,
    unread_count: 0,
    last_message_at: new Date(Date.now() - 15 * 60000).toISOString(),
    last_message_preview: '¿Cuándo puedo pasar?',
    last_message_type: 'text',
    last_message_direction: 'inbound',
    last_message_status: 'read',
    window_expires_at: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    assigned_to: null,
    tags: [],
    created_at: '2024-06-02T10:00:00Z',
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: '3',
    organization_id: '',
    whatsapp_account_id: '',
    contact_phone: '+52 (55) 4567-8901',
    contact_name: 'Roberto Sánchez',
    contact_avatar_url: null,
    status: 'active',
    is_pinned: false,
    unread_count: 1,
    last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
    last_message_preview: 'Perfecto, quedamos así',
    last_message_type: 'text',
    last_message_direction: 'outbound',
    last_message_status: 'read',
    window_expires_at: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    assigned_to: null,
    tags: [],
    created_at: '2024-06-03T10:00:00Z',
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: '4',
    organization_id: '',
    whatsapp_account_id: '',
    contact_phone: '+52 (55) 2345-6789',
    contact_name: 'María López',
    contact_avatar_url: null,
    status: 'pending',
    is_pinned: false,
    unread_count: 0,
    last_message_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    last_message_preview: 'Les envío la cotización',
    last_message_type: 'document',
    last_message_direction: 'outbound',
    last_message_status: 'delivered',
    window_expires_at: new Date(Date.now() + 20 * 60 * 60000).toISOString(),
    assigned_to: null,
    tags: [],
    created_at: '2024-06-04T10:00:00Z',
    updated_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
  {
    id: '5',
    organization_id: '',
    whatsapp_account_id: '',
    contact_phone: '+52 (55) 3456-7890',
    contact_name: 'Carlos Herrera',
    contact_avatar_url: null,
    status: 'resolved',
    is_pinned: false,
    unread_count: 0,
    last_message_at: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
    last_message_preview: 'Muchas gracias por todo',
    last_message_type: 'text',
    last_message_direction: 'inbound',
    last_message_status: 'read',
    window_expires_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    assigned_to: null,
    tags: [],
    created_at: '2024-06-05T10:00:00Z',
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
  },
]

// Demo messages for conversation 1 (type assertion due to legacy mock data structure)
const demoMessages: Record<string, unknown[]> = {
  '1': [
    {
      id: 'm1',
      conversation_id: '1',
      wamid: 'wamid_1',
      direction: 'inbound',
      message_type: 'text',
      content: 'Hola, buenos días',
      status: 'delivered',
      created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      id: 'm2',
      conversation_id: '1',
      wamid: 'wamid_2',
      direction: 'outbound',
      message_type: 'text',
      content: '¡Hola! Buenos días, ¿en qué podemos ayudarle?',
      status: 'read',
      created_at: new Date(Date.now() - 55 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 55 * 60000).toISOString(),
    },
    {
      id: 'm3',
      conversation_id: '1',
      wamid: 'wamid_3',
      direction: 'inbound',
      message_type: 'text',
      content: 'Quería información sobre sus servicios de marketing digital',
      status: 'delivered',
      created_at: new Date(Date.now() - 50 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 50 * 60000).toISOString(),
    },
    {
      id: 'm4',
      conversation_id: '1',
      wamid: 'wamid_4',
      direction: 'outbound',
      message_type: 'text',
      content: 'Por supuesto. En KORE ofrecemos servicios completos de marketing digital que incluyen:\n\n✅ Gestión de redes sociales\n✅ Campañas de email marketing\n✅ SEO y SEM\n✅ Desarrollo de contenido\n✅ Análisis y reportes\n\n¿Le interesa algún servicio en particular?',
      status: 'read',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 'm5',
      conversation_id: '1',
      wamid: 'wamid_5',
      direction: 'inbound',
      message_type: 'text',
      content: 'Me interesa principalmente la gestión de redes sociales y el email marketing',
      status: 'delivered',
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'm6',
      conversation_id: '1',
      wamid: 'wamid_6',
      direction: 'outbound',
      message_type: 'document',
      content: '[Documento]',
      media_filename: 'Cotización_KORE_Marketing.pdf',
      media_caption: 'Le comparto nuestra cotización con los detalles de los servicios',
      status: 'read',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 'm7',
      conversation_id: '1',
      wamid: 'wamid_7',
      direction: 'inbound',
      message_type: 'text',
      content: 'Gracias por la información',
      status: 'delivered',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ],
  '2': [
    {
      id: 'm8',
      conversation_id: '2',
      wamid: 'wamid_8',
      direction: 'inbound',
      message_type: 'text',
      content: 'Hola, tengo una cita programada para hoy',
      status: 'read',
      created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    },
    {
      id: 'm9',
      conversation_id: '2',
      wamid: 'wamid_9',
      direction: 'outbound',
      message_type: 'text',
      content: 'Hola Ana, sí, te esperamos a las 3pm',
      status: 'read',
      created_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
    },
    {
      id: 'm10',
      conversation_id: '2',
      wamid: 'wamid_10',
      direction: 'inbound',
      message_type: 'text',
      content: '¿Cuándo puedo pasar?',
      status: 'read',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
  ],
}

export default function WhatsAppPage() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState(demoConversations as unknown as WhatsAppConversation[])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])

  const accentColor = "#00D68F"

  const handleSelectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation)
    // Load messages for this conversation
    setMessages((demoMessages[conversation.id] || []) as WhatsAppMessage[])

    // Mark as read
    if (conversation.unread_count > 0) {
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      ))
    }
  }

  const handleSendMessage = (content: string, messageType: 'text' | 'image' | 'document' = 'text') => {
    if (!selectedConversation) return

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: selectedConversation.id,
      wamid: `wamid-${Date.now()}`,
      direction: 'outbound' as const,
      message_type: messageType,
      content,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      media_url: null,
      media_mime_type: null,
      media_filename: null,
      media_caption: null,
      template_name: null,
      template_language: null,
      template_components: null,
      interactive_type: null,
      interactive_data: null,
    } as WhatsAppMessage

    setMessages(prev => [...prev, newMessage])

    // Update conversation's last message
    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id
        ? {
            ...c,
            last_message_at: newMessage.sent_at,
            last_message_text: content,
            last_message_direction: 'outbound',
          }
        : c
    ))

    // Simulate delivery status
    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === newMessage.id ? { ...m, status: 'delivered' } : m
      ))
    }, 1000)

    toast({
      title: "Mensaje enviado",
      description: "El mensaje se ha enviado correctamente.",
    })
  }

  const handleNewConversation = () => {
    toast({
      title: "Nueva conversación",
      description: "Función para iniciar nueva conversación (modo demo).",
    })
  }

  return (
    <div className="min-h-full bg-[#0B0B0B]">
      {/* Header - Only visible on mobile when no conversation selected */}
      <div className={`p-4 border-b border-[#2A2A2A] lg:hidden ${selectedConversation ? 'hidden' : ''}`}>
        <Link
          href="/voice"
          className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Voice
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <MessageCircle className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">WhatsApp Business</h1>
            <p className="text-sm text-[#A1A1AA]">Gestiona tus conversaciones</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/voice"
              className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <MessageCircle className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">WhatsApp Business</h1>
                <p className="text-sm text-[#A1A1AA]">Gestiona tus conversaciones</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Conversations List - Hidden on mobile when conversation is selected */}
        <div className={`w-full lg:w-96 lg:flex-shrink-0 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <ConversationsList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            accentColor={accentColor}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Chat Area */}
        <div className={`flex-1 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <WhatsAppChat
            conversation={selectedConversation}
            messages={messages}
            accentColor={accentColor}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </div>
    </div>
  )
}
