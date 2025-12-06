"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { PhoneCall, ArrowLeft } from "lucide-react"
import { CallLogs } from "@/components/voice"
import type { VoiceCallLog } from "@/types/voice"
import { useToast } from "@/hooks/use-toast"

// Demo call logs (type assertion due to legacy mock data structure)
const demoCallLogs = [
  {
    id: '1',
    organization_id: '',
    external_id: 'call_001',
    direction: 'inbound',
    status: 'completed',
    from_number: '+52 (55) 1234-5678',
    to_number: '+52 (55) 0000-0001',
    contact_name: 'Carlos García',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 10 * 60000).toISOString(),
    answered_at: new Date(Date.now() - 10 * 60000 + 5000).toISOString(),
    ended_at: new Date(Date.now() - 5 * 60000).toISOString(),
    duration: 323,
    recording_url: 'https://example.com/recording1.mp3',
    transcription: 'Hola, llamaba para consultar sobre el estado de mi pedido...',
    voicemail_url: null,
    agent_id: null,
    agent_name: 'Juan Pérez',
    queue_name: 'Soporte',
    tags: ['pedido', 'consulta'],
    notes: 'Cliente consultó sobre pedido #12345',
    sentiment: 'positive',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    organization_id: '',
    external_id: 'call_002',
    direction: 'outbound',
    status: 'completed',
    from_number: '+52 (55) 0000-0001',
    to_number: '+52 (55) 9876-5432',
    contact_name: 'Empresa ABC',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 25 * 60000).toISOString(),
    answered_at: new Date(Date.now() - 25 * 60000 + 8000).toISOString(),
    ended_at: new Date(Date.now() - 12 * 60000).toISOString(),
    duration: 765,
    recording_url: 'https://example.com/recording2.mp3',
    transcription: 'Buenos días, le llamo de KORE para dar seguimiento a su cotización...',
    voicemail_url: null,
    agent_id: null,
    agent_name: 'María López',
    queue_name: 'Ventas',
    tags: ['seguimiento', 'cotización'],
    notes: 'Seguimiento a cotización enviada la semana pasada',
    sentiment: 'positive',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: '3',
    organization_id: '',
    external_id: 'call_003',
    direction: 'inbound',
    status: 'missed',
    from_number: '+52 (55) 4567-8901',
    to_number: '+52 (55) 0000-0001',
    contact_name: null,
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 1 * 60 * 60000 + 30000).toISOString(),
    duration: 0,
    recording_url: null,
    transcription: null,
    voicemail_url: null,
    agent_id: null,
    agent_name: null,
    queue_name: 'General',
    tags: [],
    notes: null,
    sentiment: null,
    created_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60000 + 30000).toISOString(),
  },
  {
    id: '4',
    organization_id: '',
    external_id: 'call_004',
    direction: 'inbound',
    status: 'completed',
    from_number: '+52 (55) 2345-6789',
    to_number: '+52 (55) 0000-0001',
    contact_name: 'María López',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    answered_at: new Date(Date.now() - 2 * 60 * 60000 + 3000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 60 * 60000 + 195000).toISOString(),
    duration: 192,
    recording_url: 'https://example.com/recording4.mp3',
    transcription: null,
    voicemail_url: null,
    agent_id: null,
    agent_name: 'Roberto Sánchez',
    queue_name: 'Soporte',
    tags: ['soporte'],
    notes: null,
    sentiment: 'neutral',
    created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60000 + 195000).toISOString(),
  },
  {
    id: '5',
    organization_id: '',
    external_id: 'call_005',
    direction: 'inbound',
    status: 'voicemail',
    from_number: '+52 (55) 3456-7890',
    to_number: '+52 (55) 0000-0001',
    contact_name: 'Pedro Ramírez',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 3 * 60 * 60000 + 45000).toISOString(),
    duration: 45,
    recording_url: null,
    transcription: null,
    voicemail_url: 'https://example.com/voicemail5.mp3',
    agent_id: null,
    agent_name: null,
    queue_name: 'General',
    tags: [],
    notes: null,
    sentiment: null,
    created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60000 + 45000).toISOString(),
  },
  {
    id: '6',
    organization_id: '',
    external_id: 'call_006',
    direction: 'outbound',
    status: 'no_answer',
    from_number: '+52 (55) 0000-0001',
    to_number: '+52 (55) 5678-9012',
    contact_name: 'Ana Torres',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    answered_at: null,
    ended_at: new Date(Date.now() - 4 * 60 * 60000 + 25000).toISOString(),
    duration: 0,
    recording_url: null,
    transcription: null,
    voicemail_url: null,
    agent_id: null,
    agent_name: 'Juan Pérez',
    queue_name: 'Ventas',
    tags: ['prospecto'],
    notes: 'Intento de contacto con prospecto',
    sentiment: null,
    created_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60000 + 25000).toISOString(),
  },
  {
    id: '7',
    organization_id: '',
    external_id: 'call_007',
    direction: 'outbound',
    status: 'completed',
    from_number: '+52 (55) 0000-0001',
    to_number: '+52 (55) 6789-0123',
    contact_name: 'Luis Mendoza',
    contact_avatar_url: null,
    started_at: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
    answered_at: new Date(Date.now() - 5 * 60 * 60000 + 6000).toISOString(),
    ended_at: new Date(Date.now() - 5 * 60 * 60000 + 486000).toISOString(),
    duration: 480,
    recording_url: 'https://example.com/recording7.mp3',
    transcription: 'Muy buenas tardes, le llamo respecto a la renovación de su contrato...',
    voicemail_url: null,
    agent_id: null,
    agent_name: 'María López',
    queue_name: 'Retención',
    tags: ['renovación', 'contrato'],
    notes: 'Cliente interesado en renovar con descuento',
    sentiment: 'positive',
    created_at: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60000 + 486000).toISOString(),
  },
]

export default function CallsPage() {
  const { toast } = useToast()
  const [calls] = useState(demoCallLogs as unknown as VoiceCallLog[])

  const accentColor = "#9B59B6"

  const handleCallBack = (phoneNumber: string) => {
    toast({
      title: "Iniciando llamada",
      description: `Llamando a ${phoneNumber}...`,
    })
  }

  const handleViewDetails = (call: VoiceCallLog) => {
    toast({
      title: "Detalles de llamada",
      description: `Viendo detalles de la llamada ${call.call_id || call.id}`,
    })
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
          href="/voice"
          className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Voice
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <PhoneCall className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Centro de Llamadas</h1>
        </div>
        <p className="text-[#A1A1AA]">Historial y gestión de llamadas telefónicas</p>
      </motion.div>

      {/* Call Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CallLogs
          calls={calls}
          accentColor={accentColor}
          onCallBack={handleCallBack}
          onViewDetails={handleViewDetails}
        />
      </motion.div>
    </div>
  )
}
