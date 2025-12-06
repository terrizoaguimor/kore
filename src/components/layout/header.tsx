"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Menu,
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
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const router = useRouter()
  const { user, organization, reset } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#1F1F1F] bg-[#0B0B0B] px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="-m-2.5 p-2.5 text-[#A1A1AA] hover:text-white lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-[#1F1F1F] lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-[#A1A1AA]"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white placeholder:text-[#A1A1AA] focus:ring-0 focus:outline-none sm:text-sm"
            placeholder="Search files, events, contacts..."
            type="search"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-[#A1A1AA] hover:text-white transition-colors relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#00E5FF]" />
          </button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#1F1F1F]"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="-m-1.5 flex items-center p-1.5 focus:outline-none">
                <span className="sr-only">Open user menu</span>
                <Avatar className="h-8 w-8 ring-2 ring-[#1F1F1F]">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#00E5FF] text-[#0B0B0B] text-xs font-semibold">
                    {getInitials(user?.full_name, user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-medium text-white"
                    aria-hidden="true"
                  >
                    {user?.full_name || user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className="ml-2 h-5 w-5 text-[#A1A1AA]"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#1F1F1F] border-[#2A2A2A] text-white"
            >
              <DropdownMenuLabel className="text-[#A1A1AA] font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">{user?.email}</p>
                  {organization && (
                    <p className="text-xs text-[#00E5FF]">{organization.name}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
              <DropdownMenuItem
                onClick={() => router.push("/settings/profile")}
                className="text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] focus:text-white cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] focus:text-white cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] focus:text-white cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
