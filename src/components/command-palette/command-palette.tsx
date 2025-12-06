"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  Sparkles,
  ArrowRight,
  Command,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  CheckSquare,
  StickyNote,
  UserCircle,
  TrendingUp,
  Phone,
  Settings,
  Plus,
  Send,
  Mail,
  Video,
  Bell,
  FolderOpen,
  Clock,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Command as CommandType, CommandGroup, CommandModule } from "@/types/command"

const moduleIcons: Record<CommandModule, React.ElementType> = {
  files: FileText,
  calendar: Calendar,
  contacts: Users,
  talk: MessageSquare,
  tasks: CheckSquare,
  notes: StickyNote,
  crm: UserCircle,
  pulse: TrendingUp,
  voice: Phone,
  settings: Settings,
  global: Command,
}

const moduleColors: Record<CommandModule, string> = {
  files: "#3B82F6",
  calendar: "#10B981",
  contacts: "#8B5CF6",
  talk: "#F59E0B",
  tasks: "#EF4444",
  notes: "#EC4899",
  crm: "#06B6D4",
  pulse: "#FF6B6B",
  voice: "#9B59B6",
  settings: "#6B7280",
  global: "#2f62ea",
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isAIMode, setIsAIMode] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [aiResponse, setAIResponse] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setIsAIMode(false)
      setAIResponse(null)
    }
  }, [isOpen])

  // Define all available commands
  const allCommands: CommandType[] = React.useMemo(() => [
    // Navigation commands
    {
      id: "nav-files",
      label: "Ir a Archivos",
      description: "Gestiona tus archivos y carpetas",
      category: "navigation",
      module: "files",
      keywords: ["archivos", "documentos", "files", "carpetas"],
      shortcut: "G F",
      action: () => router.push("/files"),
    },
    {
      id: "nav-calendar",
      label: "Ir a Calendario",
      description: "Ver eventos y citas",
      category: "navigation",
      module: "calendar",
      keywords: ["calendario", "eventos", "citas", "agenda"],
      shortcut: "G C",
      action: () => router.push("/calendar"),
    },
    {
      id: "nav-contacts",
      label: "Ir a Contactos",
      description: "Gestiona tu libreta de direcciones",
      category: "navigation",
      module: "contacts",
      keywords: ["contactos", "personas", "directorio"],
      shortcut: "G O",
      action: () => router.push("/contacts"),
    },
    {
      id: "nav-talk",
      label: "Ir a Talk",
      description: "Chat y videollamadas",
      category: "navigation",
      module: "talk",
      keywords: ["chat", "mensajes", "videollamada", "talk"],
      shortcut: "G T",
      action: () => router.push("/talk"),
    },
    {
      id: "nav-tasks",
      label: "Ir a Tareas",
      description: "Gestiona tus tareas pendientes",
      category: "navigation",
      module: "tasks",
      keywords: ["tareas", "pendientes", "todo", "tasks"],
      shortcut: "G K",
      action: () => router.push("/tasks"),
    },
    {
      id: "nav-notes",
      label: "Ir a Notas",
      description: "Tus notas personales",
      category: "navigation",
      module: "notes",
      keywords: ["notas", "apuntes", "notes"],
      shortcut: "G N",
      action: () => router.push("/notes"),
    },
    {
      id: "nav-crm",
      label: "Ir a KORE Link (CRM)",
      description: "Gestión de relaciones con clientes",
      category: "navigation",
      module: "crm",
      keywords: ["crm", "clientes", "ventas", "link", "kore link"],
      shortcut: "G L",
      action: () => router.push("/crm"),
    },
    {
      id: "nav-pulse",
      label: "Ir a KORE Pulse (Marketing)",
      description: "Campañas y contenido de marketing",
      category: "navigation",
      module: "pulse",
      keywords: ["marketing", "campañas", "pulse", "kore pulse", "email"],
      shortcut: "G P",
      action: () => router.push("/pulse"),
    },
    {
      id: "nav-voice",
      label: "Ir a KORE Voice (Telefonía)",
      description: "Llamadas y WhatsApp Business",
      category: "navigation",
      module: "voice",
      keywords: ["voz", "llamadas", "teléfono", "whatsapp", "voice"],
      shortcut: "G V",
      action: () => router.push("/voice"),
    },
    {
      id: "nav-settings",
      label: "Ir a Configuración",
      description: "Ajustes de la cuenta",
      category: "navigation",
      module: "settings",
      keywords: ["configuración", "ajustes", "settings", "cuenta"],
      shortcut: "G S",
      action: () => router.push("/settings"),
    },
    // Quick actions
    {
      id: "action-new-file",
      label: "Crear nuevo archivo",
      description: "Sube o crea un archivo",
      category: "action",
      module: "files",
      keywords: ["nuevo", "crear", "archivo", "subir"],
      action: () => router.push("/files?action=upload"),
    },
    {
      id: "action-new-event",
      label: "Crear nuevo evento",
      description: "Agenda una nueva cita",
      category: "action",
      module: "calendar",
      keywords: ["evento", "cita", "agendar", "reunión"],
      action: () => router.push("/calendar?action=new"),
    },
    {
      id: "action-new-contact",
      label: "Crear nuevo contacto",
      description: "Añade un contacto a tu libreta",
      category: "action",
      module: "contacts",
      keywords: ["contacto", "persona", "añadir"],
      action: () => router.push("/contacts?action=new"),
    },
    {
      id: "action-new-task",
      label: "Crear nueva tarea",
      description: "Añade una tarea a tu lista",
      category: "action",
      module: "tasks",
      keywords: ["tarea", "pendiente", "añadir"],
      action: () => router.push("/tasks?action=new"),
    },
    {
      id: "action-new-note",
      label: "Crear nueva nota",
      description: "Escribe una nota rápida",
      category: "action",
      module: "notes",
      keywords: ["nota", "apunte", "escribir"],
      action: () => router.push("/notes?action=new"),
    },
    {
      id: "action-new-campaign",
      label: "Crear nueva campaña",
      description: "Lanza una campaña de marketing",
      category: "action",
      module: "pulse",
      keywords: ["campaña", "marketing", "email", "lanzar"],
      action: () => router.push("/pulse/campaigns?action=new"),
    },
    {
      id: "action-start-call",
      label: "Iniciar llamada",
      description: "Realiza una llamada telefónica",
      category: "action",
      module: "voice",
      keywords: ["llamar", "teléfono", "marcar"],
      action: () => router.push("/voice/calls?action=dial"),
    },
    {
      id: "action-send-whatsapp",
      label: "Enviar WhatsApp",
      description: "Inicia una conversación de WhatsApp",
      category: "action",
      module: "voice",
      keywords: ["whatsapp", "mensaje", "enviar"],
      action: () => router.push("/voice/whatsapp?action=new"),
    },
    {
      id: "action-ai-content",
      label: "Generar contenido con IA",
      description: "Crea contenido con inteligencia artificial",
      category: "action",
      module: "pulse",
      keywords: ["ia", "ai", "contenido", "generar", "escribir"],
      isAI: true,
      action: () => router.push("/pulse/ai"),
    },
    {
      id: "action-video-call",
      label: "Iniciar videollamada",
      description: "Comienza una videollamada",
      category: "action",
      module: "talk",
      keywords: ["video", "videollamada", "reunión", "zoom"],
      action: () => router.push("/talk?action=video"),
    },
  ], [router])

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent/popular commands when no query
      return allCommands.slice(0, 8)
    }

    const lowerQuery = query.toLowerCase()
    return allCommands
      .filter((cmd) => {
        const matchLabel = cmd.label.toLowerCase().includes(lowerQuery)
        const matchDesc = cmd.description?.toLowerCase().includes(lowerQuery)
        const matchKeywords = cmd.keywords?.some((k) => k.includes(lowerQuery))
        return matchLabel || matchDesc || matchKeywords
      })
      .slice(0, 10)
  }, [query, allCommands])

  // Group commands by category
  const groupedCommands: CommandGroup[] = React.useMemo(() => {
    const groups: Record<string, CommandType[]> = {}

    filteredCommands.forEach((cmd) => {
      const groupLabel = cmd.category === 'navigation' ? 'Navegar' :
                         cmd.category === 'action' ? 'Acciones Rápidas' :
                         cmd.category === 'ai' ? 'Inteligencia Artificial' : 'Otros'

      if (!groups[groupLabel]) {
        groups[groupLabel] = []
      }
      groups[groupLabel].push(cmd)
    })

    return Object.entries(groups).map(([label, commands]) => ({
      label,
      commands,
    }))
  }, [filteredCommands])

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (isAIMode && query.trim()) {
            handleAICommand(query)
          } else if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "Tab":
          e.preventDefault()
          setIsAIMode((prev) => !prev)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, query, isAIMode, onClose])

  const executeCommand = (command: CommandType) => {
    command.action()
    onClose()
  }

  const handleAICommand = async (input: string) => {
    setIsProcessing(true)

    // Simulate AI processing - in production, this would call Supabase Edge Function
    // For now, we'll do basic pattern matching
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const lowerInput = input.toLowerCase()
    let response = ""
    let actions: (() => void)[] = []

    // Parse common patterns
    if (lowerInput.includes("enviar email") || lowerInput.includes("enviar correo")) {
      if (lowerInput.includes("vip") || lowerInput.includes("clientes")) {
        response = "Entendido. Voy a preparar un email para tu lista de clientes VIP. Te llevo a la página de campañas."
        actions.push(() => router.push("/pulse/campaigns?action=new&audience=vip"))
      } else {
        response = "Preparando nuevo email. Te llevo al generador de contenido."
        actions.push(() => router.push("/pulse/ai"))
      }
    } else if (lowerInput.includes("llamar") || lowerInput.includes("llamada")) {
      if (lowerInput.includes("mañana") || lowerInput.includes("programar") || lowerInput.includes("agendar")) {
        response = "Voy a crear un recordatorio de llamada para mañana. Abriendo calendario."
        actions.push(() => router.push("/calendar?action=new&type=call"))
      } else {
        response = "Iniciando centro de llamadas."
        actions.push(() => router.push("/voice/calls?action=dial"))
      }
    } else if (lowerInput.includes("whatsapp") || lowerInput.includes("mensaje")) {
      response = "Abriendo WhatsApp Business para enviar mensaje."
      actions.push(() => router.push("/voice/whatsapp?action=new"))
    } else if (lowerInput.includes("crear") || lowerInput.includes("nuevo")) {
      if (lowerInput.includes("campaña")) {
        response = "Creando nueva campaña de marketing."
        actions.push(() => router.push("/pulse/campaigns?action=new"))
      } else if (lowerInput.includes("tarea")) {
        response = "Creando nueva tarea."
        actions.push(() => router.push("/tasks?action=new"))
      } else if (lowerInput.includes("evento") || lowerInput.includes("cita") || lowerInput.includes("reunión")) {
        response = "Creando nuevo evento en el calendario."
        actions.push(() => router.push("/calendar?action=new"))
      } else if (lowerInput.includes("contacto")) {
        response = "Añadiendo nuevo contacto."
        actions.push(() => router.push("/contacts?action=new"))
      }
    } else if (lowerInput.includes("ver") || lowerInput.includes("mostrar") || lowerInput.includes("abrir")) {
      if (lowerInput.includes("calendario") || lowerInput.includes("agenda")) {
        response = "Abriendo tu calendario."
        actions.push(() => router.push("/calendar"))
      } else if (lowerInput.includes("tarea")) {
        response = "Mostrando tus tareas pendientes."
        actions.push(() => router.push("/tasks"))
      } else if (lowerInput.includes("archivo") || lowerInput.includes("documento")) {
        response = "Abriendo gestor de archivos."
        actions.push(() => router.push("/files"))
      }
    } else {
      response = "No estoy seguro de cómo ayudarte con eso. Intenta con comandos como:\n• 'Enviar email a clientes VIP'\n• 'Programar llamada para mañana'\n• 'Crear nueva campaña'\n• 'Ver mis tareas'"
    }

    setAIResponse(response)
    setIsProcessing(false)

    // Execute actions after showing response
    if (actions.length > 0) {
      setTimeout(() => {
        actions.forEach((action) => action())
        onClose()
      }, 1500)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#1F1F1F] shadow-2xl">
              {/* Input Area */}
              <div className="flex items-center gap-3 border-b border-[#2A2A2A] px-4 py-3">
                {isAIMode ? (
                  <Sparkles className="h-5 w-5 text-[#FF6B6B]" />
                ) : (
                  <Search className="h-5 w-5 text-[#A1A1AA]" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                    setAIResponse(null)
                  }}
                  placeholder={
                    isAIMode
                      ? "Escribe un comando en lenguaje natural..."
                      : "Buscar comandos, archivos, contactos..."
                  }
                  className="flex-1 bg-transparent text-white placeholder-[#A1A1AA] outline-none"
                />
                <button
                  onClick={() => setIsAIMode((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isAIMode
                      ? "bg-[#FF6B6B]/20 text-[#FF6B6B]"
                      : "bg-[#2A2A2A] text-[#A1A1AA] hover:text-white"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  IA
                </button>
                <kbd className="hidden rounded bg-[#2A2A2A] px-2 py-1 text-xs text-[#A1A1AA] sm:inline-block">
                  ESC
                </kbd>
              </div>

              {/* AI Response */}
              {isAIMode && (aiResponse || isProcessing) && (
                <div className="border-b border-[#2A2A2A] bg-[#FF6B6B]/5 px-4 py-3">
                  {isProcessing ? (
                    <div className="flex items-center gap-2 text-[#FF6B6B]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Procesando comando...</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 text-[#FF6B6B]" />
                      <p className="text-sm text-white whitespace-pre-line">{aiResponse}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Commands List */}
              {!isAIMode && (
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {groupedCommands.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[#A1A1AA]">No se encontraron comandos</p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Prueba con otra búsqueda o activa el modo IA
                      </p>
                    </div>
                  ) : (
                    groupedCommands.map((group) => (
                      <div key={group.label}>
                        <div className="px-4 py-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                            {group.label}
                          </span>
                        </div>
                        {group.commands.map((command) => {
                          const globalIndex = filteredCommands.indexOf(command)
                          const Icon = moduleIcons[command.module]
                          const color = moduleColors[command.module]

                          return (
                            <button
                              key={command.id}
                              onClick={() => executeCommand(command)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                selectedIndex === globalIndex
                                  ? "bg-[#2A2A2A]"
                                  : "hover:bg-[#2A2A2A]/50"
                              )}
                            >
                              <div
                                className="flex h-9 w-9 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${color}15` }}
                              >
                                <Icon className="h-4 w-4" style={{ color }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">
                                    {command.label}
                                  </span>
                                  {command.isAI && (
                                    <Sparkles className="h-3.5 w-3.5 text-[#FF6B6B]" />
                                  )}
                                </div>
                                {command.description && (
                                  <p className="text-sm text-[#A1A1AA]">
                                    {command.description}
                                  </p>
                                )}
                              </div>
                              {command.shortcut && (
                                <kbd className="rounded bg-[#2A2A2A] px-2 py-1 text-xs text-[#6B7280]">
                                  {command.shortcut}
                                </kbd>
                              )}
                              <ArrowRight className="h-4 w-4 text-[#6B7280]" />
                            </button>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AI Mode Instructions */}
              {isAIMode && !aiResponse && !isProcessing && (
                <div className="px-4 py-6">
                  <div className="mb-4 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-[#FF6B6B]" />
                    <h3 className="mt-2 font-semibold text-white">Modo IA Activado</h3>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                      Escribe comandos en lenguaje natural y KORE los ejecutará
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                      Ejemplos:
                    </p>
                    {[
                      "Enviar email a lista de clientes VIP",
                      "Programar llamada para mañana",
                      "Crear campaña de marketing para Black Friday",
                      "Mostrar mis tareas pendientes",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          setQuery(example)
                          handleAICommand(example)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg bg-[#2A2A2A]/50 px-3 py-2 text-left text-sm text-[#A1A1AA] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#2A2A2A] px-4 py-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-[#2A2A2A] px-1.5 py-0.5">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-[#2A2A2A] px-1.5 py-0.5">↵</kbd>
                    seleccionar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-[#2A2A2A] px-1.5 py-0.5">Tab</kbd>
                    modo IA
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />K para abrir
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
