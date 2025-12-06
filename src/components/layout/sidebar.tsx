"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  // KORE OS
  LayoutDashboard,
  // KORE Drive
  HardDrive,
  Files,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  CheckSquare,
  StickyNote,
  // KORE Pulse (Marketing)
  Activity,
  Megaphone,
  Share2,
  BarChart3,
  Mail,
  Target,
  Sparkles,
  // KORE Voice (Telephony)
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Voicemail,
  // KORE Link (CRM)
  Link2,
  UserCircle,
  Building2,
  Briefcase,
  HandshakeIcon,
  Receipt,
  // The Core (AI)
  Brain,
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
  items: NavItem[]
}

// Define KORE modules
const modules: NavModule[] = [
  {
    name: "os",
    label: "KORE // OS",
    icon: LayoutDashboard,
    description: "Command Center",
    color: "#00E5FF",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    name: "drive",
    label: "KORE Drive",
    icon: HardDrive,
    description: "Company Memory",
    color: "#00E5FF",
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
    name: "pulse",
    label: "KORE Pulse",
    icon: Activity,
    description: "Marketing Hub",
    color: "#FF6B6B",
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
    name: "voice",
    label: "KORE Voice",
    icon: Phone,
    description: "Brand Voice",
    color: "#9B59B6",
    items: [
      { name: "Overview", href: "/voice", icon: Phone },
      { name: "Call Center", href: "/voice/calls", icon: PhoneCall },
      { name: "Incoming", href: "/voice/incoming", icon: PhoneIncoming },
      { name: "Outgoing", href: "/voice/outgoing", icon: PhoneOutgoing },
      { name: "Voicemail", href: "/voice/voicemail", icon: Voicemail },
    ],
  },
  {
    name: "link",
    label: "KORE Link",
    icon: Link2,
    description: "Relationships",
    color: "#F39C12",
    items: [
      { name: "Overview", href: "/link", icon: Link2 },
      { name: "Contacts", href: "/link/contacts", icon: UserCircle },
      { name: "Companies", href: "/link/companies", icon: Building2 },
      { name: "Deals", href: "/link/deals", icon: Briefcase },
      { name: "Leads", href: "/link/leads", icon: HandshakeIcon },
      { name: "Invoices", href: "/link/invoices", icon: Receipt },
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
    // In collapsed mode, show only the module icon
    return (
      <div className="relative group">
        <Link
          href={module.items[0].href}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-all mx-auto",
            isActive
              ? "bg-[#00E5FF]/10 text-[#00E5FF]"
              : "text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white"
          )}
        >
          <Icon className="h-5 w-5" />
        </Link>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <p className="text-sm font-medium text-white">{module.label}</p>
            <p className="text-xs text-[#A1A1AA]">{module.description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Module header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? "text-white"
            : "text-[#A1A1AA] hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              isActive ? "bg-[#00E5FF]/20" : "bg-[#1F1F1F]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isActive ? "text-[#00E5FF]" : "text-[#A1A1AA]"
              )}
            />
          </div>
          <span>{module.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Module items */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 space-y-1 border-l border-[#1F1F1F] pl-4">
              {module.items.map((item) => {
                const ItemIcon = item.icon
                const itemActive = pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      itemActive
                        ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                        : "text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white"
                    )}
                  >
                    <ItemIcon className="h-4 w-4" />
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

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0B0B0B]">
      {/* Logo */}
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b border-[#1F1F1F] px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center">
          {isCollapsed ? (
            <KoreLogo variant="icon" size="sm" color="primary" />
          ) : (
            <KoreLogo size="md" color="primary" />
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* The Core (AI) - Special prominent button */}
      <div className={cn("px-3 py-4 border-b border-[#1F1F1F]", isCollapsed && "px-2")}>
        <Link
          href="/core"
          className={cn(
            "flex items-center gap-3 rounded-lg p-3 transition-all",
            "bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/5",
            "border border-[#00E5FF]/30",
            "hover:from-[#00E5FF]/30 hover:to-[#00E5FF]/10",
            "hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]",
            "group",
            isCollapsed && "justify-center p-2"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/20 group-hover:bg-[#00E5FF]/30 transition-colors">
            <Brain className="h-5 w-5 text-[#00E5FF]" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">The Core</p>
              <p className="text-xs text-[#A1A1AA]">Ask the AI anything</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation modules */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-4">
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

      {/* Settings */}
      <div className="border-t border-[#1F1F1F] p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
            pathname.startsWith("/settings")
              ? "bg-[#00E5FF]/10 text-[#00E5FF]"
              : "text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle (desktop) */}
      <div className="hidden lg:block border-t border-[#1F1F1F] p-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center rounded-lg p-2 text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white transition-colors",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && <span className="text-sm">Collapse</span>}
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform duration-200",
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
              className="fixed inset-0 z-50 bg-black/80 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-[#1F1F1F] transition-all duration-300",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[280px]"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
