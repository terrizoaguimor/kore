"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  // The Core (AI)
  Brain,
  // KORE Link (CRM)
  Link2,
  UserCircle,
  Building2,
  Briefcase,
  HandshakeIcon,
  Receipt,
  // KORE Voice (Telephony)
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Voicemail,
  MessageCircle,
  // KORE Meet (Video)
  Video,
  // KORE Pulse (Marketing)
  Activity,
  Megaphone,
  Share2,
  BarChart3,
  Mail,
  Target,
  Sparkles,
  // KORE Planning
  ClipboardList,
  FolderKanban,
  // KORE Drive
  HardDrive,
  Files,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  CheckSquare,
  StickyNote,
  // KORE OS
  LayoutDashboard,
  // General
  Settings,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { KoreLogo } from "@/components/brand/kore-logo"
import { motion, AnimatePresence } from "motion/react"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavModule {
  name: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
  gradient: string
  items: NavItem[]
}

// Define KORE modules in order:
// 1. KORE Link (CRM)
// 2. KORE Voice (Telephony)
// 3. KORE Meet (Video)
// 4. KORE Pulse (Marketing)
// 5. KORE Drive (Files)
// 6. KORE OS (Dashboard)
const modules: NavModule[] = [
  {
    name: "link",
    label: "KORE Link",
    icon: Link2,
    description: "Relationships & CRM",
    color: "#FFB830",
    gradient: "from-[#FFB830] to-[#F59E0B]",
    items: [
      { name: "Overview", href: "/link", icon: Link2 },
      { name: "Contacts", href: "/link/contacts", icon: UserCircle },
      { name: "Companies", href: "/link/companies", icon: Building2 },
      { name: "Deals", href: "/link/deals", icon: Briefcase },
      { name: "Leads", href: "/link/leads", icon: HandshakeIcon },
      { name: "Invoices", href: "/link/invoices", icon: Receipt },
    ],
  },
  {
    name: "voice",
    label: "KORE Voice",
    icon: Phone,
    description: "Telephony & WhatsApp",
    color: "#8B5CF6",
    gradient: "from-[#8B5CF6] to-[#7C3AED]",
    items: [
      { name: "Overview", href: "/voice", icon: Phone },
      { name: "Call Center", href: "/voice/calls", icon: PhoneCall },
      { name: "Incoming", href: "/voice/incoming", icon: PhoneIncoming },
      { name: "Outgoing", href: "/voice/outgoing", icon: PhoneOutgoing },
      { name: "Voicemail", href: "/voice/voicemail", icon: Voicemail },
      { name: "WhatsApp", href: "/voice/whatsapp", icon: MessageCircle },
    ],
  },
  {
    name: "meet",
    label: "KORE Meet",
    icon: Video,
    description: "Video Meetings",
    color: "#10B981",
    gradient: "from-[#10B981] to-[#059669]",
    items: [
      { name: "Meetings", href: "/meet", icon: Video },
    ],
  },
  {
    name: "pulse",
    label: "KORE Pulse",
    icon: Activity,
    description: "Marketing Hub",
    color: "#FF6B6B",
    gradient: "from-[#FF6B6B] to-[#EF4444]",
    items: [
      { name: "Overview", href: "/pulse", icon: Activity },
      { name: "Campaigns", href: "/pulse/campaigns", icon: Megaphone },
      { name: "Social Media", href: "/pulse/social", icon: Share2 },
      { name: "Analytics", href: "/pulse/analytics", icon: BarChart3 },
      { name: "Email Marketing", href: "/pulse/email", icon: Mail },
      { name: "Audience", href: "/pulse/audience", icon: Target },
      { name: "AI Content", href: "/pulse/ai", icon: Sparkles },
    ],
  },
  {
    name: "planning",
    label: "KORE Planning",
    icon: ClipboardList,
    description: "Action Plans & Tasks",
    color: "#14B8A6",
    gradient: "from-[#14B8A6] to-[#0D9488]",
    items: [
      { name: "Overview", href: "/planning", icon: ClipboardList },
      { name: "Plans", href: "/planning/plans", icon: FolderKanban },
    ],
  },
  {
    name: "drive",
    label: "KORE Drive",
    icon: HardDrive,
    description: "Company Memory",
    color: "#00E5FF",
    gradient: "from-[#00E5FF] to-[#0EA5E9]",
    items: [
      { name: "Files", href: "/files", icon: Files },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Contacts", href: "/contacts", icon: Users },
      { name: "Talk", href: "/talk", icon: MessageSquare },
      { name: "Office", href: "/office", icon: FileText },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Notes", href: "/notes", icon: StickyNote },
    ],
  },
  {
    name: "os",
    label: "KORE // OS",
    icon: LayoutDashboard,
    description: "Command Center",
    color: "#06B6D4",
    gradient: "from-[#06B6D4] to-[#0891B2]",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
]

// The Core (AI) - Special module
const coreModule = {
  name: "The Core",
  href: "/core",
  icon: Brain,
  description: "Ask the AI",
  color: "#00E5FF",
}

function ModuleSection({
  module,
  isCollapsed,
  pathname,
}: {
  module: NavModule
  isCollapsed: boolean
  pathname: string
}) {
  const [isExpanded, setIsExpanded] = useState(
    module.items.some((item) => pathname.startsWith(item.href))
  )
  const Icon = module.icon
  const isActive = module.items.some((item) => pathname.startsWith(item.href))

  if (isCollapsed) {
    // In collapsed mode, show only the module icon with gradient
    return (
      <div className="relative group">
        <Link
          href={module.items[0].href}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all mx-auto",
            isActive
              ? `bg-gradient-to-br ${module.gradient} shadow-lg`
              : "bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 hover:border-white/10"
          )}
          style={isActive ? { boxShadow: `0 4px 20px ${module.color}30` } : {}}
        >
          <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-[#A1A1AA] group-hover:text-white")} />
        </Link>
        {/* Tooltip with gradient accent */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
          <div className="relative">
            <div className={cn("absolute -inset-[1px] bg-gradient-to-r rounded-lg opacity-50", module.gradient)} />
            <div className="relative bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
              <p className="text-sm font-medium text-white">{module.label}</p>
              <p className="text-xs text-[#A1A1AA]">{module.description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Module header with gradient on active */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 text-white"
            : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              isActive
                ? `bg-gradient-to-br ${module.gradient} shadow-lg`
                : "bg-[#1A1A1A] group-hover:bg-[#252525]"
            )}
            style={isActive ? { boxShadow: `0 4px 15px ${module.color}25` } : {}}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-white" : "text-[#A1A1AA]"
              )}
            />
          </div>
          <span className={isActive ? "font-semibold" : ""}>{module.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Module items with gradient hover */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-4 space-y-0.5 border-l border-white/5 pl-4 py-1">
              {module.items.map((item) => {
                const ItemIcon = item.icon
                const itemActive = pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group/item",
                      itemActive
                        ? `bg-gradient-to-r ${module.gradient} text-white shadow-md`
                        : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                    )}
                    style={itemActive ? { boxShadow: `0 2px 10px ${module.color}30` } : {}}
                  >
                    <ItemIcon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", itemActive && "text-white")} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const isCoreActive = pathname === "/core" || pathname.startsWith("/core/")

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0B0B0B] relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FF]/[0.02] via-transparent to-[#8B5CF6]/[0.02] pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        "relative flex h-16 shrink-0 items-center border-b border-white/5 px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/core" className="flex items-center group">
          {isCollapsed ? (
            <KoreLogo variant="icon" size="sm" color="gradient" />
          ) : (
            <KoreLogo size="md" color="gradient" />
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* The Core (AI) - Premium gradient button */}
      <div className={cn("relative px-3 py-4 border-b border-white/5", isCollapsed && "px-2")}>
        <Link
          href="/core"
          className={cn(
            "relative flex items-center gap-3 rounded-xl p-3 transition-all duration-300 overflow-hidden group",
            isCoreActive
              ? "bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] shadow-lg shadow-[#00E5FF]/25"
              : "bg-gradient-to-r from-[#00E5FF]/10 to-[#8B5CF6]/10 border border-white/10 hover:border-[#00E5FF]/30",
            isCollapsed && "justify-center p-2"
          )}
        >
          {/* Animated gradient background on hover */}
          {!isCoreActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/20 to-[#8B5CF6]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}

          <div className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
            isCoreActive
              ? "bg-white/20"
              : "bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 group-hover:from-[#00E5FF]/30 group-hover:to-[#00E5FF]/10"
          )}>
            <Brain className={cn(
              "h-5 w-5 transition-transform group-hover:scale-110",
              isCoreActive ? "text-white" : "text-[#00E5FF]"
            )} />
          </div>
          {!isCollapsed && (
            <div className="relative flex-1">
              <p className={cn(
                "text-sm font-semibold",
                isCoreActive ? "text-white" : "text-white"
              )}>The Core</p>
              <p className={cn(
                "text-xs",
                isCoreActive ? "text-white/70" : "text-[#A1A1AA]"
              )}>Ask the AI anything</p>
            </div>
          )}
          {!isCollapsed && (
            <Sparkles className={cn(
              "h-4 w-4 transition-all group-hover:rotate-12",
              isCoreActive ? "text-white/70" : "text-[#FFB830]"
            )} />
          )}
        </Link>
      </div>

      {/* Navigation modules */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <div className="space-y-3">
          {modules.map((module) => (
            <ModuleSection
              key={module.name}
              module={module}
              isCollapsed={isCollapsed}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>

      {/* Settings with gradient */}
      <div className="relative border-t border-white/5 p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group",
            pathname.startsWith("/settings")
              ? "bg-gradient-to-r from-[#A1A1AA]/20 to-[#A1A1AA]/5 text-white border border-white/10"
              : "text-[#A1A1AA] hover:bg-white/5 hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className={cn(
            "h-5 w-5 transition-transform group-hover:rotate-90 duration-300",
            pathname.startsWith("/settings") && "text-white"
          )} />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle (desktop) with animation */}
      <div className="relative hidden lg:block border-t border-white/5 p-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center rounded-xl p-2.5 text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-all duration-200 group",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && <span className="text-sm">Collapse</span>}
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] lg:hidden shadow-2xl shadow-[#00E5FF]/10"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar with subtle border gradient */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col transition-all duration-300 relative",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[280px]"
        )}
      >
        {/* Right border gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#00E5FF]/20 via-white/5 to-[#8B5CF6]/20" />
        <SidebarContent />
      </aside>
    </>
  )
}
