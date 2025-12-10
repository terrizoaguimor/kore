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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { formatBytes, cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"
import type { Organization } from "@/types/database"

interface OrganizationWithStats extends Organization {
  member_count: number
  file_count: number
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchOrganizations = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any

      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })

      if (orgsError) throw orgsError

      // Fetch stats for each organization
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

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    )
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
    if (percentage >= 70) return "from-[#FFB830] to-[#F59E0B]"
    return "from-[#10B981] to-[#059669]"
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
        <Button className="bg-gradient-to-r from-[#8B5CF6] to-[#FF6B6B] text-white hover:opacity-90 transition-opacity">
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
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] transition-all"
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
          <div className="animate-spin h-8 w-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#FF6B6B]/20 group-hover:from-[#8B5CF6]/30 group-hover:to-[#FF6B6B]/30 transition-all">
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
                    {/* Members */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-white mb-1">
                        <Users className="h-4 w-4 text-[#00E5FF]" />
                        <span className="text-lg font-semibold">{org.member_count}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA]">Members</p>
                    </div>

                    {/* Files */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-white mb-1">
                        <HardDrive className="h-4 w-4 text-[#10B981]" />
                        <span className="text-lg font-semibold">{org.file_count}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA]">Files</p>
                    </div>

                    {/* Storage */}
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
                      className="w-48 bg-[#1A1A1A]/95 backdrop-blur-xl border-white/10"
                    >
                      <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer">
                        <HardDrive className="mr-2 h-4 w-4" />
                        Manage Storage
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 cursor-pointer">
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-gradient-to-r from-[#8B5CF6] to-[#FF6B6B] text-white"
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
