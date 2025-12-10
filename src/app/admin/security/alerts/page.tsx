"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Ban,
  Zap,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"

interface SecurityAlert {
  id: string
  alert_type: string
  severity: string
  ip_address: string | null
  description: string
  metadata: Record<string, unknown> | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [showUnresolved, setShowUnresolved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = `/api/security/alerts?hours=168&limit=200`
      if (severityFilter !== "all") {
        url += `&severity=${severityFilter}`
      }
      if (showUnresolved) {
        url += `&unresolved=true`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch")
      const { data } = await response.json()
      setAlerts(data || [])
    } catch (error) {
      console.error("Error fetching alerts:", error)
      toast.error("Failed to load alerts")
    } finally {
      setIsLoading(false)
    }
  }, [severityFilter, showUnresolved])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleResolve = async (id: string, resolve: boolean) => {
    try {
      const response = await fetch("/api/security/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_resolved: resolve }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success(resolve ? "Alert resolved" : "Alert reopened")
      fetchAlerts()
    } catch (error) {
      console.error("Error updating alert:", error)
      toast.error("Failed to update alert")
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      alert.description.toLowerCase().includes(query) ||
      alert.alert_type.toLowerCase().includes(query) ||
      alert.ip_address?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return Zap
      case "high": return AlertTriangle
      case "warning": return Eye
      default: return Shield
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-[#FF6B6B] bg-[#FF6B6B]/10 border-[#FF6B6B]/30"
      case "high": return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
      case "warning": return "text-[#FFB830] bg-[#FFB830]/10 border-[#FFB830]/30"
      default: return "text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30"
    }
  }

  const getAlertTypeIcon = (type: string) => {
    if (type.includes("block")) return Ban
    if (type.includes("brute")) return Zap
    if (type.includes("threat")) return AlertTriangle
    return Shield
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB830] to-[#F59E0B]">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
            <p className="text-[#A1A1AA] mt-1">
              Monitor and manage security events
            </p>
          </div>
        </div>
        <Button
          onClick={() => { setIsLoading(true); fetchAlerts() }}
          className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FFB830]/50"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFB830]/50 cursor-pointer"
            >
              <option value="all" className="bg-[#1A1A1A]">All Severities</option>
              <option value="critical" className="bg-[#1A1A1A]">Critical</option>
              <option value="high" className="bg-[#1A1A1A]">High</option>
              <option value="warning" className="bg-[#1A1A1A]">Warning</option>
              <option value="info" className="bg-[#1A1A1A]">Info</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] pointer-events-none" />
          </div>

          <button
            onClick={() => {
              setShowUnresolved(!showUnresolved)
              setCurrentPage(1)
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
              showUnresolved
                ? "bg-[#FFB830]/20 text-[#FFB830] border border-[#FFB830]/30"
                : "bg-white/5 text-[#A1A1AA] border border-white/10 hover:bg-white/10"
            )}
          >
            Unresolved Only
          </button>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-[#A1A1AA]">
            <AlertTriangle className="h-4 w-4" />
            <span>{filteredAlerts.length} alerts</span>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#FFB830] border-t-transparent rounded-full" />
        </div>
      ) : paginatedAlerts.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="h-12 w-12 text-[#10B981] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No alerts found</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery || severityFilter !== "all" || showUnresolved
              ? "Try adjusting your filters"
              : "No security alerts in the selected time period"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedAlerts.map((alert, index) => {
            const SeverityIcon = getSeverityIcon(alert.severity)
            const TypeIcon = getAlertTypeIcon(alert.alert_type)

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "group p-5 rounded-2xl border transition-all",
                  alert.is_resolved
                    ? "bg-white/5 border-white/10 opacity-60"
                    : `bg-white/5 ${getSeverityColor(alert.severity).split(" ")[2]}`
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0",
                    getSeverityColor(alert.severity).split(" ").slice(0, 2).join(" ")
                  )}>
                    <SeverityIcon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                        getSeverityColor(alert.severity)
                      )}>
                        {alert.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-[#A1A1AA]">
                        {alert.alert_type.replace(/_/g, " ")}
                      </span>
                      {alert.is_resolved && (
                        <span className="px-2 py-0.5 rounded-md bg-[#10B981]/10 text-xs text-[#10B981]">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-white mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                      {alert.ip_address && (
                        <span className="font-mono">{alert.ip_address}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.is_resolved ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolve(alert.id, true)}
                        className="text-[#10B981] hover:text-[#10B981] hover:bg-[#10B981]/10"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolve(alert.id, false)}
                        className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length}
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
                      ? "bg-gradient-to-r from-[#FFB830] to-[#F59E0B] text-[#0B0B0B]"
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
