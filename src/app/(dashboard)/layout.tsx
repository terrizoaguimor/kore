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
      <div className="flex h-screen items-center justify-center bg-[#0B0B0B]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <p className="text-sm text-[#A1A1AA]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Command Palette - Global */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />

      <div className="flex h-screen bg-[#0B0B0B]">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />
          <main className="flex-1 overflow-auto bg-[#0B0B0B]">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
