"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Building2,
  HardDrive,
  Activity,
  Settings,
  Shield,
  ArrowLeft,
  LayoutDashboard,
  FileText,
  Bell,
  ShieldAlert,
  Ban,
  Globe,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { KoreLogo } from "@/components/brand/kore-logo"
import { TooltipProvider } from "@/components/ui/tooltip"

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", description: "Overview and statistics" },
  { href: "/admin/organizations", icon: Building2, label: "Organizations", description: "Manage all organizations" },
  { href: "/admin/users", icon: Users, label: "Users", description: "User management" },
  { href: "/admin/logs", icon: Activity, label: "Activity Logs", description: "System activity" },
]

const securityNavItems = [
  { href: "/admin/security", icon: ShieldAlert, label: "KORE Security", description: "Security dashboard" },
  { href: "/admin/security/blocked-ips", icon: Ban, label: "Blocked IPs", description: "IP management" },
  { href: "/admin/security/alerts", icon: AlertTriangle, label: "Alerts", description: "Security alerts" },
  { href: "/admin/security/traffic", icon: Globe, label: "Traffic Monitor", description: "Global traffic" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is admin/owner of any organization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase as any)
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])

      if (!memberships || memberships.length === 0) {
        router.push("/core")
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1a4a]">
        <div className="animate-spin h-8 w-8 border-2 border-[#0046E2] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-[#0f1a4a]">
        {/* Ambient gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[400px] -left-[400px] w-[800px] h-[800px] bg-[#1b2d7c]/[0.03] rounded-full blur-[150px]" />
          <div className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] bg-[#FF6B6B]/[0.03] rounded-full blur-[150px]" />
        </div>

        {/* Sidebar */}
        <div className="relative w-72 border-r border-white/5 bg-[#0f1a4a]/95 backdrop-blur-xl z-10">
          {/* Gradient border */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#1b2d7c]/20 via-white/5 to-[#FF6B6B]/20" />

          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1b2d7c] to-[#FF6B6B]">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Admin Panel</p>
                <p className="text-xs text-[#A1A1AA]">KORE Management</p>
              </div>
            </div>
          </div>

          {/* Back to App */}
          <div className="p-3 border-b border-white/5">
            <Link
              href="/core"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to KORE</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href) && !pathname.startsWith("/admin/security"))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-[#1b2d7c]/20 to-[#FF6B6B]/10 text-white border border-white/10"
                      : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-br from-[#1b2d7c] to-[#FF6B6B]"
                      : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#A1A1AA] group-hover:text-white")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-medium", isActive && "text-white")}>{item.label}</p>
                    <p className="text-xs text-[#A1A1AA]">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Security Section */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider px-3">Security</p>
          </div>
          <nav className="p-3 pt-1 space-y-1">
            {securityNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin/security" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-[#FF6B6B]/20 to-[#EF4444]/10 text-white border border-[#FF6B6B]/20"
                      : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-br from-[#FF6B6B] to-[#EF4444]"
                      : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#A1A1AA] group-hover:text-white")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-medium", isActive && "text-white")}>{item.label}</p>
                    <p className="text-xs text-[#A1A1AA]">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <KoreLogo variant="icon" size="sm" color="gradient" />
              <span>KORE Platform v1.0</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative flex-1 overflow-auto z-10">
          {children}
        </div>
      </div>
    </TooltipProvider>
  )
}
