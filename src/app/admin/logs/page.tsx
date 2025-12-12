"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Search,
  RefreshCw,
  Activity,
  FileText,
  User as UserIcon,
  Building2,
  Calendar,
  MessageSquare,
  CheckSquare,
  StickyNote,
  Upload,
  Download,
  Trash2,
  Edit3,
  LogIn,
  LogOut,
  Share2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"
import type { ActivityLog, User, Organization } from "@/types/database"

interface ActivityLogWithDetails extends ActivityLog {
  user: User | null
  organization: Organization | null
}

const actionConfig: Record<string, { icon: typeof Activity; color: string; bgColor: string }> = {
  create: { icon: Edit3, color: "text-[#10B981]", bgColor: "bg-[#10B981]/10" },
  update: { icon: Edit3, color: "text-[#0046E2]", bgColor: "bg-[#0046E2]/10" },
  delete: { icon: Trash2, color: "text-[#FF6B6B]", bgColor: "bg-[#FF6B6B]/10" },
  login: { icon: LogIn, color: "text-[#1b2d7c]", bgColor: "bg-[#1b2d7c]/10" },
  logout: { icon: LogOut, color: "text-[#A1A1AA]", bgColor: "bg-white/10" },
  upload: { icon: Upload, color: "text-[#0046E2]", bgColor: "bg-[#0046E2]/10" },
  download: { icon: Download, color: "text-[#0046E2]", bgColor: "bg-[#0046E2]/10" },
  share: { icon: Share2, color: "text-[#FF6B6B]", bgColor: "bg-[#FF6B6B]/10" },
  view: { icon: Eye, color: "text-[#A1A1AA]", bgColor: "bg-white/10" },
}

const entityConfig: Record<string, { icon: typeof FileText; color: string }> = {
  file: { icon: FileText, color: "text-[#0046E2]" },
  folder: { icon: FileText, color: "text-[#0046E2]" },
  user: { icon: UserIcon, color: "text-[#1b2d7c]" },
  organization: { icon: Building2, color: "text-[#FF6B6B]" },
  calendar: { icon: Calendar, color: "text-[#10B981]" },
  contact: { icon: UserIcon, color: "text-[#0046E2]" },
  message: { icon: MessageSquare, color: "text-[#0046E2]" },
  task: { icon: CheckSquare, color: "text-[#1b2d7c]" },
  note: { icon: StickyNote, color: "text-[#FF6B6B]" },
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any

      let query = supabase
        .from("activity_logs")
        .select(`
          *,
          user:users(*),
          organization:organizations(*)
        `)
        .order("created_at", { ascending: false })
        .limit(500)

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter)
      }

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs((data as ActivityLogWithDetails[]) || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("Failed to load activity logs")
    } finally {
      setIsLoading(false)
    }
  }, [actionFilter, entityFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.user?.email.toLowerCase().includes(query) ||
      log.user?.full_name?.toLowerCase().includes(query) ||
      log.organization?.name?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getActionConfig = (action: string) => {
    return actionConfig[action.toLowerCase()] || { icon: Activity, color: "text-[#A1A1AA]", bgColor: "bg-white/10" }
  }

  const getEntityConfig = (entity: string) => {
    return entityConfig[entity.toLowerCase()] || { icon: FileText, color: "text-[#A1A1AA]" }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-[#A1A1AA] mt-1">
            Monitor all activity across the platform
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          className="bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search by user, action, or entity..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Action Filter */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#1b2d7c]">All Actions</option>
              <option value="create" className="bg-[#1b2d7c]">Create</option>
              <option value="update" className="bg-[#1b2d7c]">Update</option>
              <option value="delete" className="bg-[#1b2d7c]">Delete</option>
              <option value="login" className="bg-[#1b2d7c]">Login</option>
              <option value="logout" className="bg-[#1b2d7c]">Logout</option>
              <option value="upload" className="bg-[#1b2d7c]">Upload</option>
              <option value="download" className="bg-[#1b2d7c]">Download</option>
              <option value="share" className="bg-[#1b2d7c]">Share</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] pointer-events-none" />
          </div>

          {/* Entity Filter */}
          <div className="relative">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#1b2d7c]">All Entities</option>
              <option value="file" className="bg-[#1b2d7c]">Files</option>
              <option value="folder" className="bg-[#1b2d7c]">Folders</option>
              <option value="user" className="bg-[#1b2d7c]">Users</option>
              <option value="organization" className="bg-[#1b2d7c]">Organizations</option>
              <option value="calendar" className="bg-[#1b2d7c]">Calendar</option>
              <option value="contact" className="bg-[#1b2d7c]">Contacts</option>
              <option value="message" className="bg-[#1b2d7c]">Messages</option>
              <option value="task" className="bg-[#1b2d7c]">Tasks</option>
              <option value="note" className="bg-[#1b2d7c]">Notes</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] pointer-events-none" />
          </div>

          {/* Count */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-[#A1A1AA]">
            <Activity className="h-4 w-4" />
            <span>{filteredLogs.length} logs</span>
          </div>
        </div>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#0046E2] border-t-transparent rounded-full" />
        </div>
      ) : paginatedLogs.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="h-12 w-12 text-[#A1A1AA] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No activity logs found</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery || actionFilter !== "all" || entityFilter !== "all"
              ? "Try adjusting your filters"
              : "Activity will appear here as users interact with the platform"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedLogs.map((log, index) => {
            const actionCfg = getActionConfig(log.action)
            const entityCfg = getEntityConfig(log.entity_type)
            const ActionIcon = actionCfg.icon
            const EntityIcon = entityCfg.icon

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Action Icon */}
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0", actionCfg.bgColor)}>
                    <ActionIcon className={cn("h-5 w-5", actionCfg.color)} />
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    {log.user ? (
                      <>
                        <Avatar className="h-8 w-8 ring-2 ring-white/10">
                          <AvatarImage src={log.user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1b2d7c] to-[#FF6B6B] text-white text-xs font-semibold">
                            {log.user.full_name?.substring(0, 2).toUpperCase() || log.user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {log.user.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-[#A1A1AA] truncate">{log.user.email}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-[#A1A1AA]" />
                        </div>
                        <span className="text-sm text-[#A1A1AA]">System</span>
                      </>
                    )}
                  </div>

                  {/* Action Badge */}
                  <div className={cn("px-3 py-1 rounded-lg text-xs font-medium capitalize", actionCfg.bgColor, actionCfg.color)}>
                    {log.action}
                  </div>

                  {/* Entity Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs">
                    <EntityIcon className={cn("h-3.5 w-3.5", entityCfg.color)} />
                    <span className="text-white capitalize">{log.entity_type}</span>
                  </div>

                  {/* Organization */}
                  <div className="hidden md:block flex-1 min-w-0">
                    {log.organization ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#A1A1AA]" />
                        <span className="text-sm text-[#A1A1AA] truncate">{log.organization.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#A1A1AA]">—</span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="hidden lg:block text-right min-w-[140px]">
                    <p className="text-sm text-white">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-[#A1A1AA] flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>

                {/* Details (if present) */}
                {log.details && typeof log.details === "object" && Object.keys(log.details).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-[#A1A1AA] font-mono truncate">
                      {JSON.stringify(log.details)}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-[#A1A1AA]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    currentPage === page
                      ? "bg-gradient-to-r from-[#0046E2] to-[#F59E0B] text-[#0f1a4a]"
                      : "bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white"
                  )}
                >
                  {page}
                </button>
              )
            })}
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
