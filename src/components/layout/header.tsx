"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Menu,
  Command,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { QuickTooltip } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const router = useRouter()
  const { user, organization, reset } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      reset()
      toast.success("Logged out successfully")
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast.error("Failed to log out")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-[#0f1a4a]/95 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0046E2]/[0.02] via-transparent to-[#1b2d7c]/[0.02] pointer-events-none" />

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="relative -m-2.5 p-2.5 text-[#A1A1AA] hover:text-white transition-colors rounded-lg hover:bg-white/5 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-white/10 lg:hidden" aria-hidden="true" />

      <div className="relative flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search with gradient border on focus */}
        <form className="relative flex flex-1 items-center" action="#" method="GET">
          <div className={cn(
            "relative flex flex-1 max-w-lg rounded-xl transition-all duration-300",
            isSearchFocused
              ? "bg-white/5 ring-1 ring-[#0046E2]/30 shadow-lg shadow-[#0046E2]/5"
              : "bg-transparent"
          )}>
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <Search
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                isSearchFocused ? "text-[#0046E2]" : "text-[#A1A1AA]"
              )}
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block w-full border-0 bg-transparent py-2.5 pl-10 pr-12 text-sm text-white placeholder:text-[#A1A1AA] focus:ring-0 focus:outline-none"
              placeholder="Search files, events, contacts..."
              type="search"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {/* Keyboard shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <kbd className="flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-medium text-[#A1A1AA]">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </form>

        {/* Right side actions */}
        <div className="relative flex items-center gap-x-3 lg:gap-x-4">
          {/* AI Quick Action Button */}
          <QuickTooltip
            content="Ask AI"
            description="Get instant help from KORE's AI assistant"
            gradient="from-[#0046E2] to-[#8B5CF6]"
            side="bottom"
          >
            <button
              type="button"
              onClick={() => router.push("/core")}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0046E2]/10 to-[#1b2d7c]/10 border border-white/10 text-sm text-white hover:border-[#0046E2]/30 transition-all duration-200 group"
            >
              <Sparkles className="h-4 w-4 text-[#FDFBE7] group-hover:rotate-12 transition-transform" />
              <span className="text-[#A1A1AA] group-hover:text-white transition-colors">Ask AI</span>
            </button>
          </QuickTooltip>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-white/10"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 focus:outline-none rounded-xl hover:bg-white/5 transition-all group">
                <span className="sr-only">Open user menu</span>
                <div className="relative">
                  <Avatar className="h-8 w-8 ring-2 ring-white/10 group-hover:ring-[#0046E2]/30 transition-all">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] text-xs font-semibold">
                      {getInitials(user?.full_name, user?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f1a4a] bg-[#10B981]" />
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-2 text-sm font-medium text-white group-hover:text-[#0046E2] transition-colors"
                    aria-hidden="true"
                  >
                    {user?.full_name || user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className="ml-1 h-4 w-4 text-[#A1A1AA] group-hover:text-[#0046E2] transition-colors"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-[#1b2d7c]/95 backdrop-blur-xl border-white/10 text-white rounded-xl shadow-2xl shadow-black/50"
            >
              <DropdownMenuLabel className="font-normal px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white/10">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] text-sm font-semibold">
                      {getInitials(user?.full_name, user?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-white">
                      {user?.full_name || "User"}
                    </p>
                    <p className="text-xs text-[#A1A1AA]">{user?.email}</p>
                    {organization && (
                      <p className="text-xs bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] bg-clip-text text-transparent font-medium">{organization.name}</p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => router.push("/settings/profile")}
                  className="text-[#A1A1AA] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2 transition-all"
                >
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="text-[#A1A1AA] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2 transition-all"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[#A1A1AA] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2 transition-all"
                >
                  <HelpCircle className="mr-3 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer rounded-lg px-3 py-2 transition-all"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
