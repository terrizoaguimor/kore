"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Search,
  MoreHorizontal,
  Shield,
  UserCog,
  Trash2,
  Users,
  Mail,
  Plus,
  ChevronLeft,
  ChevronRight,
  Crown,
  UserCheck,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"
import type { User, OrganizationMember, Organization } from "@/types/database"

interface UserWithMemberships extends User {
  memberships: (OrganizationMember & { organization: Organization })[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithMemberships[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchUsers = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      // Fetch memberships for each user
      const usersWithMemberships = await Promise.all(
        (usersData || []).map(async (user: User) => {
          const { data: memberships } = await supabase
            .from("organization_members")
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq("user_id", user.id)

          return {
            ...user,
            memberships: memberships || [],
          }
        })
      )

      setUsers(usersWithMemberships as UserWithMemberships[])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      default:
        return <UserCheck className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "text-[#FFB830] bg-[#FFB830]/10"
      case "admin":
        return "text-[#8B5CF6] bg-[#8B5CF6]/10"
      default:
        return "text-[#A1A1AA] bg-white/10"
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-[#A1A1AA] mt-1">
            Manage users and their organization memberships
          </p>
        </div>
        <Button className="bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-semibold hover:opacity-90 transition-opacity">
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <Users className="h-4 w-4" />
          <span>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#00E5FF] border-t-transparent rounded-full" />
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-[#A1A1AA] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No users found</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery ? "Try adjusting your search" : "Invite your first user to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-14 w-14 ring-2 ring-white/10 group-hover:ring-[#00E5FF]/30 transition-all">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] text-lg font-semibold">
                    {user.full_name?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {user.full_name || "Unnamed User"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Organizations */}
                <div className="hidden md:block">
                  <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                    {user.memberships.length === 0 ? (
                      <span className="text-sm text-[#A1A1AA]">No organizations</span>
                    ) : (
                      user.memberships.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                            getRoleColor(m.role)
                          )}
                        >
                          {getRoleIcon(m.role)}
                          <span>{m.organization?.name}</span>
                        </div>
                      ))
                    )}
                    {user.memberships.length > 3 && (
                      <div className="px-2 py-1 rounded-lg bg-white/10 text-xs text-[#A1A1AA]">
                        +{user.memberships.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity */}
                <div className="hidden lg:block text-right min-w-[120px]">
                  <p className="text-sm text-white mb-1">
                    {user.last_activity_at
                      ? formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true })
                      : "Never active"}
                  </p>
                  <p className="text-xs text-[#A1A1AA] flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" />
                    Joined {format(new Date(user.created_at), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <MoreHorizontal className="h-5 w-5 text-[#A1A1AA]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-[#1A1A1A]/95 backdrop-blur-xl border-white/10"
                  >
                    <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-[#A1A1AA]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B]"
                    : "bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
