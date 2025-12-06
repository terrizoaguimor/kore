"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  CheckSquare,
  StickyNote,
  UserCircle,
  TrendingUp,
  Phone,
  Bell,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ModuleActivity, CommandModule } from "@/types/command"

const moduleConfig: Record<CommandModule, {
  label: string
  description: string
  icon: React.ElementType
  color: string
  href: string
}> = {
  files: {
    label: "Archivos",
    description: "Gestiona documentos y carpetas",
    icon: FileText,
    color: "#3B82F6",
    href: "/files",
  },
  calendar: {
    label: "Calendario",
    description: "Eventos y citas programadas",
    icon: Calendar,
    color: "#10B981",
    href: "/calendar",
  },
  contacts: {
    label: "Contactos",
    description: "Libreta de direcciones",
    icon: Users,
    color: "#8B5CF6",
    href: "/contacts",
  },
  talk: {
    label: "Talk",
    description: "Chat y videollamadas",
    icon: MessageSquare,
    color: "#F59E0B",
    href: "/talk",
  },
  tasks: {
    label: "Tareas",
    description: "Lista de pendientes",
    icon: CheckSquare,
    color: "#EF4444",
    href: "/tasks",
  },
  notes: {
    label: "Notas",
    description: "Apuntes personales",
    icon: StickyNote,
    color: "#EC4899",
    href: "/notes",
  },
  crm: {
    label: "KORE Link",
    description: "Gestión de clientes (CRM)",
    icon: UserCircle,
    color: "#06B6D4",
    href: "/crm",
  },
  pulse: {
    label: "KORE Pulse",
    description: "Marketing y campañas",
    icon: TrendingUp,
    color: "#FF6B6B",
    href: "/pulse",
  },
  voice: {
    label: "KORE Voice",
    description: "Telefonía y WhatsApp",
    icon: Phone,
    color: "#9B59B6",
    href: "/voice",
  },
  settings: {
    label: "Configuración",
    description: "Ajustes del sistema",
    icon: UserCircle,
    color: "#6B7280",
    href: "/settings",
  },
  global: {
    label: "Global",
    description: "Comandos globales",
    icon: UserCircle,
    color: "#2f62ea",
    href: "/",
  },
}

interface AdaptiveModuleProps {
  activity: ModuleActivity
  onToggleExpanded: () => void
  children?: React.ReactNode
  quickActions?: {
    label: string
    icon: React.ElementType
    onClick: () => void
  }[]
}

export function AdaptiveModule({
  activity,
  onToggleExpanded,
  children,
  quickActions,
}: AdaptiveModuleProps) {
  const config = moduleConfig[activity.module]
  const Icon = config.icon

  const hasNotifications = activity.unreadCount > 0 || activity.hasUrgent || activity.pendingTasks > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-300",
        activity.isExpanded
          ? "border-[#2A2A2A] bg-[#1F1F1F]"
          : "border-transparent bg-[#1F1F1F]/50 hover:bg-[#1F1F1F] hover:border-[#2A2A2A]",
        activity.hasUrgent && "ring-2 ring-red-500/30"
      )}
      style={{
        borderColor: activity.hasUrgent ? `${config.color}40` : undefined,
      }}
    >
      {/* Urgent indicator */}
      {activity.hasUrgent && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: config.color }}
        />
      )}

      {/* Header - Always visible */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer",
          !activity.isExpanded && "py-3"
        )}
        onClick={onToggleExpanded}
      >
        {/* Module Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-lg transition-all",
            activity.isExpanded ? "h-10 w-10" : "h-8 w-8"
          )}
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon
            className={cn(
              "transition-all",
              activity.isExpanded ? "h-5 w-5" : "h-4 w-4"
            )}
            style={{ color: config.color }}
          />
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-white truncate",
              activity.isExpanded ? "text-base" : "text-sm"
            )}>
              {config.label}
            </h3>
            {hasNotifications && (
              <div className="flex items-center gap-1">
                {activity.unreadCount > 0 && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium text-white px-1.5"
                    style={{ backgroundColor: config.color }}
                  >
                    {activity.unreadCount > 99 ? "99+" : activity.unreadCount}
                  </span>
                )}
                {activity.hasUrgent && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {activity.isExpanded && (
            <p className="text-sm text-[#A1A1AA] truncate">{config.description}</p>
          )}
        </div>

        {/* Expand/Collapse button */}
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#2A2A2A] hover:text-white transition-colors"
        >
          {activity.isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {activity.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#2A2A2A] px-4 py-3">
              {/* Custom content */}
              {children}

              {/* Quick Actions */}
              {quickActions && quickActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickActions.map((action, index) => {
                    const ActionIcon = action.icon
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
                      >
                        <ActionIcon className="h-3.5 w-3.5" />
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Go to module link */}
              <Link
                href={config.href}
                className="mt-3 flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
                style={{ color: config.color }}
                onClick={(e) => e.stopPropagation()}
              >
                Ir a {config.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority indicator bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#2A2A2A]">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${activity.priority}%`,
            backgroundColor: config.color,
            opacity: activity.isExpanded ? 1 : 0.5,
          }}
        />
      </div>
    </motion.div>
  )
}
