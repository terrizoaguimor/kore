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
  ChevronLeft,
  ChevronRight,
  Crown,
  UserCheck,
  Clock,
  Building2,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [membershipsDialogOpen, setMembershipsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithMemberships | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Edit form state
  const [editFullName, setEditFullName] = useState("")
  const [editPhone, setEditPhone] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const { data } = await response.json()
      setUsers(data || [])
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
        return "text-[#0046E2] bg-[#0046E2]/10"
      case "admin":
        return "text-[#1b2d7c] bg-[#1b2d7c]/10"
      default:
        return "text-[#A1A1AA] bg-white/10"
    }
  }

  const handleEditClick = (user: UserWithMemberships) => {
    setSelectedUser(user)
    setEditFullName(user.full_name || "")
    setEditPhone(user.phone || "")
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (user: UserWithMemberships) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleMembershipsClick = (user: UserWithMemberships) => {
    setSelectedUser(user)
    setMembershipsDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editFullName,
          phone: editPhone,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to update user")
      }

      toast.success("User updated successfully")
      setEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to delete user")
      }

      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMembership = async (membershipId: string, orgName: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/remove-member?member_id=${membershipId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to remove membership")
      }

      toast.success(`Removed from ${orgName}`)

      // Update local state
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          memberships: selectedUser.memberships.filter(m => m.id !== membershipId)
        })
      }
      fetchUsers()
    } catch (error) {
      console.error("Error removing membership:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove membership")
    }
  }

  const handleUpdateMembershipRole = async (membershipId: string, orgId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: membershipId, role: newRole }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to update role")
      }

      toast.success("Role updated successfully")

      // Update local state
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          memberships: selectedUser.memberships.map(m =>
            m.id === membershipId ? { ...m, role: newRole as "owner" | "admin" | "member" | "guest" } : m
          )
        })
      }
      fetchUsers()
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update role")
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
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all"
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
          <div className="animate-spin h-8 w-8 border-2 border-[#0046E2] border-t-transparent rounded-full" />
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-[#A1A1AA] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No users found</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery ? "Try adjusting your search" : "No users in the system yet"}
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
                <Avatar className="h-14 w-14 ring-2 ring-white/10 group-hover:ring-[#0046E2]/30 transition-all">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] text-lg font-semibold">
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
                    className="w-48 bg-[#1b2d7c]/95 backdrop-blur-xl border-white/10"
                  >
                    <DropdownMenuItem
                      onClick={() => handleEditClick(user)}
                      className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMembershipsClick(user)}
                      className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manage Memberships
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(user)}
                      className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 cursor-pointer"
                    >
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
                    ? "bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a]"
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Update user profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 ring-2 ring-white/10">
                <AvatarImage src={selectedUser?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] text-xl font-semibold">
                  {selectedUser?.full_name?.substring(0, 2).toUpperCase() || selectedUser?.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser?.email}</p>
                <p className="text-sm text-[#A1A1AA]">User ID: {selectedUser?.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1AA]">Full Name</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1AA]">Phone</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] font-semibold hover:opacity-90"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              This action cannot be undone. The user will be removed from all organizations.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#FF6B6B]/20 text-[#FF6B6B] font-semibold">
                    {selectedUser?.full_name?.substring(0, 2).toUpperCase() || selectedUser?.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{selectedUser?.full_name || "Unnamed User"}</p>
                  <p className="text-sm text-[#A1A1AA]">{selectedUser?.email}</p>
                </div>
              </div>
              {selectedUser && selectedUser.memberships.length > 0 && (
                <p className="mt-3 text-sm text-[#FF6B6B]">
                  This user is a member of {selectedUser.memberships.length} organization{selectedUser.memberships.length !== 1 ? "s" : ""}.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90"
            >
              {isSaving ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Memberships Dialog */}
      <Dialog open={membershipsDialogOpen} onOpenChange={setMembershipsDialogOpen}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Memberships</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Manage organization memberships for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedUser?.memberships.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-[#A1A1AA] mx-auto mb-3" />
                <p className="text-[#A1A1AA]">No organization memberships</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedUser?.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0046E2]/20 to-[#1A5AE8]/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-[#0046E2]" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{membership.organization?.name}</p>
                        <p className="text-xs text-[#A1A1AA]">
                          Joined {format(new Date(membership.joined_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={membership.role}
                        onChange={(e) => handleUpdateMembershipRole(membership.id, membership.organization_id, e.target.value)}
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMembership(membership.id, membership.organization?.name || "organization")}
                        className="p-2 rounded-lg hover:bg-[#FF6B6B]/10 text-[#A1A1AA] hover:text-[#FF6B6B] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMembershipsDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
