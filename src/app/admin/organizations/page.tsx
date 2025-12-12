"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Search,
  MoreHorizontal,
  Users,
  HardDrive,
  Settings,
  Trash2,
  Plus,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon,
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { formatBytes, cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  storage_used: number
  storage_quota: number
  created_at: string
  updated_at: string
}

interface OrganizationWithStats extends Organization {
  member_count: number
  file_count: number
}

interface Member {
  id: string
  role: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithStats | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formStorageQuota, setFormStorageQuota] = useState(5)
  const [addMemberEmail, setAddMemberEmail] = useState("")
  const [addMemberRole, setAddMemberRole] = useState("member")

  const fetchOrganizations = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any

      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })

      if (orgsError) throw orgsError

      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (org: Organization) => {
          const [{ count: memberCount }, { count: fileCount }] = await Promise.all([
            supabase
              .from("organization_members")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id),
            supabase
              .from("files")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .eq("type", "file"),
          ])

          return {
            ...org,
            member_count: memberCount || 0,
            file_count: fileCount || 0,
          }
        })
      )

      setOrganizations(orgsWithStats)
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to load organizations")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const fetchMembers = async (orgId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/members`)
      if (!response.ok) throw new Error("Failed to fetch members")
      const { data } = await response.json()
      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Failed to load members")
    }
  }

  const handleCreate = async () => {
    if (!formName || !formSlug) {
      toast.error("Name and slug are required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          storage_quota: formStorageQuota * 1024 * 1024 * 1024, // GB to bytes
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to create organization")
      }

      toast.success("Organization created successfully")
      setShowCreateModal(false)
      resetForm()
      fetchOrganizations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedOrg || !formName) {
      toast.error("Name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          storage_quota: formStorageQuota * 1024 * 1024 * 1024,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to update organization")
      }

      toast.success("Organization updated successfully")
      setShowEditModal(false)
      resetForm()
      fetchOrganizations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOrg) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete organization")

      toast.success("Organization deleted successfully")
      setShowDeleteModal(false)
      setSelectedOrg(null)
      fetchOrganizations()
    } catch (error) {
      toast.error("Failed to delete organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedOrg || !addMemberEmail) {
      toast.error("Email is required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addMemberEmail,
          role: addMemberRole,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to add member")
      }

      toast.success("Member added successfully")
      setAddMemberEmail("")
      setAddMemberRole("member")
      fetchMembers(selectedOrg.id)
      fetchOrganizations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/members?member_id=${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove member")

      toast.success("Member removed successfully")
      fetchMembers(selectedOrg.id)
      fetchOrganizations()
    } catch (error) {
      toast.error("Failed to remove member")
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, role }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      toast.success("Role updated successfully")
      fetchMembers(selectedOrg.id)
    } catch (error) {
      toast.error("Failed to update role")
    }
  }

  const resetForm = () => {
    setFormName("")
    setFormSlug("")
    setFormStorageQuota(5)
    setSelectedOrg(null)
  }

  const openEditModal = (org: OrganizationWithStats) => {
    setSelectedOrg(org)
    setFormName(org.name)
    setFormSlug(org.slug)
    setFormStorageQuota(Math.round(org.storage_quota / (1024 * 1024 * 1024)))
    setShowEditModal(true)
  }

  const openMembersModal = (org: OrganizationWithStats) => {
    setSelectedOrg(org)
    fetchMembers(org.id)
    setShowMembersModal(true)
  }

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return org.name.toLowerCase().includes(query) || org.slug.toLowerCase().includes(query)
  })

  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage)
  const paginatedOrgs = filteredOrgs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStoragePercentage = (used: number, quota: number) => {
    if (quota === 0) return 0
    return Math.min((used / quota) * 100, 100)
  }

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return "from-[#FF6B6B] to-[#EF4444]"
    if (percentage >= 70) return "from-[#0046E2] to-[#F59E0B]"
    return "from-[#10B981] to-[#059669]"
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return Crown
      case "admin": return Shield
      default: return UserIcon
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "text-[#0046E2]"
      case "admin": return "text-[#1b2d7c]"
      default: return "text-[#A1A1AA]"
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-[#A1A1AA] mt-1">
            Manage all organizations and their resources
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#1b2d7c] to-[#FF6B6B] text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50 focus:border-[#1b2d7c] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <Building2 className="h-4 w-4" />
          <span>{filteredOrgs.length} organization{filteredOrgs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#1b2d7c] border-t-transparent rounded-full" />
        </div>
      ) : paginatedOrgs.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 text-[#A1A1AA] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No organizations found</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery ? "Try adjusting your search" : "Create your first organization to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedOrgs.map((org, index) => {
            const storagePercentage = getStoragePercentage(org.storage_used, org.storage_quota)

            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1b2d7c]/20 to-[#FF6B6B]/20 group-hover:from-[#1b2d7c]/30 group-hover:to-[#FF6B6B]/30 transition-all">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {org.name.substring(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">{org.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-[#A1A1AA]">
                        {org.slug}
                      </span>
                    </div>
                    <p className="text-sm text-[#A1A1AA]">
                      Created {format(new Date(org.created_at), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-white mb-1">
                        <Users className="h-4 w-4 text-[#0046E2]" />
                        <span className="text-lg font-semibold">{org.member_count}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA]">Members</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-white mb-1">
                        <HardDrive className="h-4 w-4 text-[#10B981]" />
                        <span className="text-lg font-semibold">{org.file_count}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA]">Files</p>
                    </div>

                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#A1A1AA]">Storage</span>
                        <span className="text-white font-medium">{storagePercentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all", getStorageColor(storagePercentage))}
                          style={{ width: `${storagePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1">
                        {formatBytes(org.storage_used)} / {formatBytes(org.storage_quota)}
                      </p>
                    </div>
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
                        onClick={() => openEditModal(org)}
                        className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openMembersModal(org)}
                        className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrg(org)
                          setShowDeleteModal(true)
                        }}
                        className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Organization
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-[#A1A1AA]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrgs.length)} of {filteredOrgs.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-gradient-to-r from-[#1b2d7c] to-[#FF6B6B] text-white"
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

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create Organization</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Create a new organization to manage teams and resources
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"))
                }}
                placeholder="My Organization"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="my-organization"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Storage Quota (GB)</label>
              <input
                type="number"
                value={formStorageQuota}
                onChange={(e) => setFormStorageQuota(parseInt(e.target.value) || 5)}
                min="1"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setShowCreateModal(false); resetForm() }}
              className="text-[#A1A1AA] hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#1b2d7c] to-[#FF6B6B] text-white"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Organization</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Update organization settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] mb-2 block">Storage Quota (GB)</label>
              <input
                type="number"
                value={formStorageQuota}
                onChange={(e) => setFormStorageQuota(parseInt(e.target.value) || 5)}
                min="1"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setShowEditModal(false); resetForm() }}
              className="text-[#A1A1AA] hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#1b2d7c] to-[#FF6B6B] text-white"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#FF6B6B]">Delete Organization</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete <span className="text-white font-semibold">{selectedOrg?.name}</span>?
              This will permanently remove all data associated with this organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => { setShowDeleteModal(false); setSelectedOrg(null) }}
              className="text-[#A1A1AA] hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-[#FF6B6B] hover:bg-[#EF4444] text-white"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Manage Members</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              {selectedOrg?.name} - {members.length} members
            </DialogDescription>
          </DialogHeader>

          {/* Add Member */}
          <div className="flex gap-2 py-4 border-b border-white/10">
            <input
              type="email"
              value={addMemberEmail}
              onChange={(e) => setAddMemberEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
            />
            <select
              value={addMemberRole}
              onChange={(e) => setAddMemberRole(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1b2d7c]/50"
            >
              <option value="member" className="bg-[#1b2d7c]">Member</option>
              <option value="admin" className="bg-[#1b2d7c]">Admin</option>
              <option value="owner" className="bg-[#1b2d7c]">Owner</option>
            </select>
            <Button
              onClick={handleAddMember}
              disabled={isSubmitting || !addMemberEmail}
              size="sm"
              className="bg-[#1b2d7c] hover:bg-[#7C3AED] text-white"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Members List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {members.map((member) => {
              const RoleIcon = getRoleIcon(member.role)
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1b2d7c] to-[#FF6B6B] flex items-center justify-center text-white font-semibold">
                    {member.user.full_name?.[0] || member.user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user.full_name || member.user.email}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">{member.user.email}</p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                    className={cn(
                      "rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs font-medium focus:outline-none",
                      getRoleColor(member.role)
                    )}
                  >
                    <option value="member" className="bg-[#1b2d7c] text-white">Member</option>
                    <option value="admin" className="bg-[#1b2d7c] text-white">Admin</option>
                    <option value="owner" className="bg-[#1b2d7c] text-white">Owner</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 rounded-lg hover:bg-[#FF6B6B]/10 text-[#A1A1AA] hover:text-[#FF6B6B] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setShowMembersModal(false); setMembers([]) }}
              className="text-[#A1A1AA] hover:text-white hover:bg-white/5"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
