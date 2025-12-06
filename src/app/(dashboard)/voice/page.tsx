"use client"

import Link from "next/link"
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Voicemail,
  PhoneMissed,
  Clock,
  Users,
  MessageCircle,
  Plus,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const stats = [
  {
    name: "Llamadas Hoy",
    value: "48",
    change: "+8",
    icon: Phone,
  },
  {
    name: "Duración Promedio",
    value: "4:32",
    change: "+0:45",
    icon: Clock,
  },
  {
    name: "Llamadas Perdidas",
    value: "3",
    change: "-2",
    icon: PhoneMissed,
  },
  {
    name: "Chats WhatsApp",
    value: "24",
    change: "+5",
    icon: MessageCircle,
  },
]

const modules = [
  {
    name: "WhatsApp Business",
    description: "Gestiona conversaciones de WhatsApp",
    icon: MessageCircle,
    href: "/voice/whatsapp",
    count: "12 Activos",
    color: "#25D366",
  },
  {
    name: "Centro de Llamadas",
    description: "Monitoreo y gestión de llamadas",
    icon: PhoneCall,
    href: "/voice/calls",
    count: "3 Activas",
    color: "#9B59B6",
  },
  {
    name: "Llamadas Entrantes",
    description: "Historial de llamadas entrantes",
    icon: PhoneIncoming,
    href: "/voice/incoming",
    count: "24 Hoy",
    color: "#9B59B6",
  },
  {
    name: "Llamadas Salientes",
    description: "Historial de llamadas salientes",
    icon: PhoneOutgoing,
    href: "/voice/outgoing",
    count: "21 Hoy",
    color: "#9B59B6",
  },
  {
    name: "Buzón de Voz",
    description: "Escucha y gestiona mensajes de voz",
    icon: Voicemail,
    href: "/voice/voicemail",
    count: "5 Nuevos",
    color: "#9B59B6",
  },
]

const recentCalls = [
  { name: "Carlos García", number: "+52 (55) 1234-5678", type: "incoming", duration: "5:23", time: "Hace 10 min" },
  { name: "Empresa ABC", number: "+52 (55) 9876-5432", type: "outgoing", duration: "12:45", time: "Hace 25 min" },
  { name: "Desconocido", number: "+52 (55) 4567-8901", type: "missed", duration: "-", time: "Hace 1 hora" },
  { name: "María López", number: "+52 (55) 2345-6789", type: "incoming", duration: "3:12", time: "Hace 2 horas" },
]

const recentWhatsApp = [
  { name: "Juan Pérez", message: "Gracias por la información", unread: 2, time: "Hace 5 min" },
  { name: "Ana Martínez", message: "¿Cuándo puedo pasar?", unread: 0, time: "Hace 15 min" },
  { name: "Roberto Sánchez", message: "Perfecto, quedamos así", unread: 1, time: "Hace 30 min" },
]

export default function VoicePage() {
  const accentColor = "#9B59B6"

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9B59B6]/20">
              <Phone className="h-5 w-5 text-[#9B59B6]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">KORE Voice</h1>
              <p className="text-sm text-[#A1A1AA]">Telefonía & WhatsApp Business</p>
            </div>
          </div>
        </motion.div>
        <Link
          href="/voice/whatsapp"
          className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#25D366]/90 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Link>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-[#A1A1AA]" />
                <span className="text-xs font-medium text-[#9B59B6]">
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-[#A1A1AA]">{stat.name}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">Herramientas de Comunicación</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.name} href={module.href}>
                <div className="group rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-5 transition-all hover:border-[var(--color)]/30 hover:shadow-[0_0_20px_rgba(155,89,182,0.1)]" style={{ '--color': module.color } as React.CSSProperties}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${module.color}15` }}>
                      <Icon className="h-5 w-5" style={{ color: module.color }} />
                    </div>
                    <span className="rounded-full bg-[#0B0B0B] px-2 py-1 text-xs text-[#A1A1AA]">
                      {module.count}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{module.name}</h3>
                  <p className="mt-1 text-sm text-[#A1A1AA]">{module.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Two Columns: Recent Calls & WhatsApp */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Calls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Llamadas Recientes</h2>
            <Link href="/voice/calls" className="text-sm text-[#9B59B6] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] divide-y divide-[#2A2A2A]">
            {recentCalls.map((call, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    call.type === "incoming" ? "bg-green-500/10" :
                    call.type === "outgoing" ? "bg-blue-500/10" : "bg-red-500/10"
                  )}>
                    {call.type === "incoming" ? (
                      <PhoneIncoming className="h-5 w-5 text-green-400" />
                    ) : call.type === "outgoing" ? (
                      <PhoneOutgoing className="h-5 w-5 text-blue-400" />
                    ) : (
                      <PhoneMissed className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{call.name}</p>
                    <p className="text-sm text-[#A1A1AA]">{call.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-white">{call.duration}</p>
                    <p className="text-[#A1A1AA]">Duración</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-[#A1A1AA]">{call.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent WhatsApp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Chats WhatsApp</h2>
            <Link href="/voice/whatsapp" className="text-sm text-[#25D366] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] divide-y divide-[#2A2A2A]">
            {recentWhatsApp.map((chat, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/20">
                    <span className="text-sm font-medium text-[#25D366]">
                      {chat.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{chat.name}</p>
                    <p className="text-sm text-[#A1A1AA] truncate max-w-[200px]">{chat.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#A1A1AA]">{chat.time}</span>
                  {chat.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25D366] text-xs font-medium text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
