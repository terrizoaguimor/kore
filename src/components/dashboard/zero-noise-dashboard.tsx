"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  Command,
  Sparkles,
  Plus,
  Calendar,
  Clock,
  TrendingUp,
  Bell,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Users,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdaptiveModule } from "./adaptive-module"
import { useDashboardStore, getSortedModules } from "@/stores/dashboard-store"
import { useCommandPalette } from "@/hooks/use-command-palette"
import type { CommandModule } from "@/types/command"

// Demo data for modules - in production this would come from real APIs
const demoModuleData: Record<CommandModule, {
  items: { label: string; sublabel?: string; urgent?: boolean }[]
  stats?: { label: string; value: string | number }[]
}> = {
  tasks: {
    items: [
      { label: "Revisar propuesta de cliente", sublabel: "Vence hoy", urgent: true },
      { label: "Preparar presentación Q4", sublabel: "Vence mañana" },
      { label: "Actualizar documentación", sublabel: "Esta semana" },
    ],
    stats: [
      { label: "Pendientes", value: 8 },
      { label: "Completadas hoy", value: 3 },
    ],
  },
  calendar: {
    items: [
      { label: "Reunión con equipo de ventas", sublabel: "10:00 AM" },
      { label: "Llamada con cliente VIP", sublabel: "2:30 PM" },
      { label: "Review semanal", sublabel: "4:00 PM" },
    ],
    stats: [
      { label: "Eventos hoy", value: 5 },
    ],
  },
  voice: {
    items: [
      { label: "3 llamadas perdidas", sublabel: "Última: hace 15 min", urgent: true },
      { label: "5 mensajes de WhatsApp sin leer", sublabel: "2 de clientes nuevos" },
    ],
    stats: [
      { label: "Llamadas hoy", value: 12 },
      { label: "WhatsApp activos", value: 8 },
    ],
  },
  crm: {
    items: [
      { label: "Nuevo lead: Empresa ABC", sublabel: "Hace 2 horas" },
      { label: "Seguimiento pendiente: María López", sublabel: "Contactar hoy", urgent: true },
    ],
    stats: [
      { label: "Deals activos", value: 15 },
      { label: "Valor pipeline", value: "$125K" },
    ],
  },
  pulse: {
    items: [
      { label: "Campaña 'Black Friday' activa", sublabel: "32% apertura" },
      { label: "Nuevo template disponible", sublabel: "Email navideño" },
    ],
    stats: [
      { label: "Campañas activas", value: 3 },
      { label: "Emails enviados", value: "2.4K" },
    ],
  },
  talk: {
    items: [
      { label: "2 mensajes sin leer de @carlos", sublabel: "Hace 10 min" },
      { label: "Reunión de equipo programada", sublabel: "En 30 min" },
    ],
    stats: [
      { label: "Chats activos", value: 4 },
    ],
  },
  files: {
    items: [
      { label: "Propuesta_Q4.pdf compartido contigo", sublabel: "Por Juan" },
      { label: "3 archivos nuevos en 'Proyectos'", sublabel: "Hoy" },
    ],
    stats: [
      { label: "Archivos recientes", value: 12 },
    ],
  },
  contacts: {
    items: [
      { label: "Nuevo contacto importado", sublabel: "Desde Gmail" },
    ],
    stats: [
      { label: "Total contactos", value: 234 },
    ],
  },
  notes: {
    items: [
      { label: "Ideas para campaña Q1", sublabel: "Editado ayer" },
    ],
    stats: [
      { label: "Notas", value: 15 },
    ],
  },
  settings: {
    items: [],
    stats: [],
  },
  global: {
    items: [],
    stats: [],
  },
}

export function ZeroNoiseDashboard() {
  const router = useRouter()
  const { open: openCommandPalette } = useCommandPalette()
  const { modules, toggleModuleExpanded, updateModuleActivity } = useDashboardStore()
  const sortedModules = getSortedModules(modules)

  // Simulate real-time updates - in production this would be WebSocket subscriptions
  React.useEffect(() => {
    // Set initial demo data
    updateModuleActivity("tasks", { pendingTasks: 8 })
    updateModuleActivity("voice", { unreadCount: 3, hasUrgent: true })
    updateModuleActivity("crm", { hasUrgent: true, pendingTasks: 2 })
    updateModuleActivity("talk", { unreadCount: 2 })
    updateModuleActivity("pulse", { pendingTasks: 1 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }, [])

  // Filter modules to show (exclude settings and global)
  const visibleModules = sortedModules.filter(
    (m) => m.module !== "settings" && m.module !== "global"
  )

  // Split into expanded and collapsed
  const expandedModules = visibleModules.filter((m) => m.isExpanded)
  const collapsedModules = visibleModules.filter((m) => !m.isExpanded)

  return (
    <div className="min-h-full bg-[#0f1a4a] p-6">
      {/* Header with Command Bar */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">{greeting}</h1>
            <p className="text-[#A1A1AA]">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Command Bar Trigger */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1F1F1F] px-4 py-3 text-left transition-all hover:border-[#3A3A3A] hover:bg-[#2A2A2A] lg:min-w-[400px]"
          >
            <Command className="h-5 w-5 text-[#6B7280]" />
            <span className="flex-1 text-[#6B7280]">
              Escribe un comando o busca algo...
            </span>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-[#2A2A2A] px-2 py-0.5 text-xs text-[#6B7280]">
                ⌘
              </kbd>
              <kbd className="rounded bg-[#2A2A2A] px-2 py-0.5 text-xs text-[#6B7280]">
                K
              </kbd>
            </div>
          </button>
        </motion.div>

        {/* AI Suggestion Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 flex items-center gap-3 rounded-xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B6B]/20">
            <Sparkles className="h-5 w-5 text-[#FF6B6B]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white">
              <span className="font-medium">Sugerencia IA:</span>{" "}
              Tienes 3 llamadas perdidas y un seguimiento pendiente. ¿Quieres que prepare un resumen?
            </p>
          </div>
          <button className="rounded-lg bg-[#FF6B6B] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#FF6B6B]/90 transition-colors">
            Sí, preparar
          </button>
          <button className="text-sm text-[#A1A1AA] hover:text-white transition-colors">
            Descartar
          </button>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {[
          { label: "Tareas pendientes", value: "8", icon: CheckCircle2, color: "#EF4444", trend: "+2 hoy" },
          { label: "Eventos hoy", value: "5", icon: Calendar, color: "#10B981", trend: "Próximo: 10:00 AM" },
          { label: "Llamadas perdidas", value: "3", icon: Phone, color: "#9B59B6", trend: "Última: 15 min" },
          { label: "Mensajes sin leer", value: "7", icon: MessageSquare, color: "#F59E0B", trend: "2 urgentes" },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#2A2A2A] bg-[#1F1F1F] p-4"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="mt-2 text-sm text-[#A1A1AA]">{stat.label}</p>
              <p className="mt-1 text-xs text-[#6B7280]">{stat.trend}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Adaptive Modules Grid */}
      <div className="space-y-6">
        {/* Expanded Modules */}
        {expandedModules.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-[#6B7280]">
              <Bell className="h-4 w-4" />
              Requiere atención ({expandedModules.length})
            </h2>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {expandedModules.map((activity) => {
                const data = demoModuleData[activity.module]
                return (
                  <AdaptiveModule
                    key={activity.module}
                    activity={activity}
                    onToggleExpanded={() => toggleModuleExpanded(activity.module)}
                    quickActions={[
                      {
                        label: "Ver todo",
                        icon: Plus,
                        onClick: () => router.push(`/${activity.module === "crm" ? "crm" : activity.module}`),
                      },
                    ]}
                  >
                    {/* Module-specific content */}
                    <div className="space-y-2">
                      {data.items.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-start gap-2 rounded-lg bg-[#2A2A2A]/50 p-2",
                            item.urgent && "border-l-2 border-red-400"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.label}</p>
                            {item.sublabel && (
                              <p className="text-xs text-[#6B7280]">{item.sublabel}</p>
                            )}
                          </div>
                          {item.urgent && (
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    {data.stats && data.stats.length > 0 && (
                      <div className="mt-3 flex gap-4">
                        {data.stats.map((stat, index) => (
                          <div key={index} className="text-center">
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-[#6B7280]">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </AdaptiveModule>
                )
              })}
            </div>
          </div>
        )}

        {/* Collapsed Modules */}
        {collapsedModules.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-[#6B7280]">
              <Clock className="h-4 w-4" />
              Otros módulos ({collapsedModules.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collapsedModules.map((activity) => (
                <AdaptiveModule
                  key={activity.module}
                  activity={activity}
                  onToggleExpanded={() => toggleModuleExpanded(activity.module)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
