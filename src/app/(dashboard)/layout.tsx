"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CommandPalette } from "@/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2 } from "lucide-react"
import FloatingDialer from "@/components/voice/floating-dialer"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette()
  const { setUser, setOrganization, setOrganizations, setMembership, isLoading, setLoading, setInitialized, isInitialized } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = createClient()

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Get user profile
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (user) {
        setUser(user)
      }

      // Get user's organizations
      const { data: memberships } = await supabase
        .from("organization_members")
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq("user_id", session.user.id)

      if (memberships && memberships.length > 0) {
        const orgs = memberships.map((m: any) => m.organization)
        setOrganizations(orgs)

        // Set first organization as active if none selected
        const currentOrg = useAuthStore.getState().organization
        if (!currentOrg && orgs.length > 0) {
          setOrganization(orgs[0])
          setMembership(memberships[0])
        }
      }

      setLoading(false)
      setInitialized(true)
    }

    initializeAuth()

    // Subscribe to auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          useAuthStore.getState().reset()
          router.push("/login")
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, setUser, setOrganization, setOrganizations, setMembership, setLoading, setInitialized])

  if (isLoading && !isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0B0B] relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative flex flex-col items-center gap-4">
          {/* Animated loader with gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF] to-[#8B5CF6] rounded-full blur-md opacity-50 animate-pulse" />
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#0EA5E9] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          </div>
          <p className="text-sm text-[#A1A1AA]">Loading KORE...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* Command Palette - Global */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />

      {/* Floating Dialer - Global */}
      <FloatingDialer />

      <div className="flex h-screen bg-[#0B0B0B] relative">
        {/* Subtle ambient gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[400px] -left-[400px] w-[800px] h-[800px] bg-[#00E5FF]/[0.03] rounded-full blur-[150px]" />
          <div className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] bg-[#8B5CF6]/[0.03] rounded-full blur-[150px]" />
        </div>

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-hidden z-10">
          <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
