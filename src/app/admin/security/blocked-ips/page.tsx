"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Ban,
  Search,
  Plus,
  Trash2,
  Clock,
  Shield,
  AlertTriangle,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"

interface BlockedIP {
  id: string
  ip_address: string
  reason: string
  blocked_at: string
  expires_at: string | null
  is_permanent: boolean
  blocked_by: string
}

export default function BlockedIPsPage() {
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newIp, setNewIp] = useState({ ip_address: "", reason: "", expires_in_hours: "" })

  const fetchBlockedIps = useCallback(async () => {
    try {
      const response = await fetch("/api/security/blocked-ips")
      if (!response.ok) throw new Error("Failed to fetch")
      const { data } = await response.json()
      setBlockedIps(data || [])
    } catch (error) {
      console.error("Error fetching blocked IPs:", error)
      toast.error("Failed to load blocked IPs")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlockedIps()
  }, [fetchBlockedIps])

  const handleBlockIp = async () => {
    if (!newIp.ip_address || !newIp.reason) {
      toast.error("IP address and reason are required")
      return
    }

    try {
      const response = await fetch("/api/security/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: newIp.ip_address,
          reason: newIp.reason,
          expires_in_hours: newIp.expires_in_hours ? parseInt(newIp.expires_in_hours) : null,
        }),
      })

      if (!response.ok) throw new Error("Failed to block IP")

      toast.success("IP blocked successfully")
      setShowAddModal(false)
      setNewIp({ ip_address: "", reason: "", expires_in_hours: "" })
      fetchBlockedIps()
    } catch (error) {
      console.error("Error blocking IP:", error)
      toast.error("Failed to block IP")
    }
  }

  const handleUnblockIp = async (ip: string) => {
    try {
      const response = await fetch(`/api/security/blocked-ips?ip=${encodeURIComponent(ip)}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to unblock IP")

      toast.success("IP unblocked successfully")
      fetchBlockedIps()
    } catch (error) {
      console.error("Error unblocking IP:", error)
      toast.error("Failed to unblock IP")
    }
  }

  const filteredIps = blockedIps.filter((ip) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ip.ip_address.toLowerCase().includes(query) ||
      ip.reason.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#EF4444]">
            <Ban className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Blocked IPs</h1>
            <p className="text-[#A1A1AA] mt-1">
              Manage blocked IP addresses
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-[#FF6B6B] to-[#EF4444] text-white hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Block IP
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search by IP or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-[#A1A1AA]">
          <Ban className="h-4 w-4" />
          <span>{filteredIps.length} blocked</span>
        </div>
      </div>

      {/* Blocked IPs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
        </div>
      ) : filteredIps.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="h-12 w-12 text-[#10B981] mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-1">No blocked IPs</p>
          <p className="text-sm text-[#A1A1AA]">
            {searchQuery ? "No IPs match your search" : "All traffic is currently allowed"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIps.map((ip, index) => (
            <motion.div
              key={ip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF6B6B]/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B6B]/10">
                  <Ban className="h-6 w-6 text-[#FF6B6B]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-lg font-semibold text-white font-mono">
                      {ip.ip_address}
                    </code>
                    {ip.is_permanent ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#FF6B6B]/10 text-xs text-[#FF6B6B] font-medium">
                        Permanent
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-[#0046E2]/10 text-xs text-[#0046E2] font-medium">
                        Temporary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#A1A1AA]">{ip.reason}</p>
                </div>

                <div className="hidden md:block text-right min-w-[180px]">
                  <p className="text-sm text-white mb-1">
                    Blocked {formatDistanceToNow(new Date(ip.blocked_at), { addSuffix: true })}
                  </p>
                  {ip.expires_at && (
                    <p className="text-xs text-[#A1A1AA] flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(ip.expires_at), "MMM d, HH:mm")}
                    </p>
                  )}
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    by {ip.blocked_by}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnblockIp(ip.ip_address)}
                  className="text-[#10B981] hover:text-[#10B981] hover:bg-[#10B981]/10"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Unblock
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md p-6 rounded-2xl bg-[#1b2d7c] border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Block IP Address</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-[#A1A1AA]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={newIp.ip_address}
                  onChange={(e) => setNewIp({ ...newIp, ip_address: e.target.value })}
                  placeholder="192.168.1.1"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Reason
                </label>
                <textarea
                  value={newIp.reason}
                  onChange={(e) => setNewIp({ ...newIp, reason: e.target.value })}
                  placeholder="Reason for blocking..."
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Expires in (hours)
                </label>
                <input
                  type="number"
                  value={newIp.expires_in_hours}
                  onChange={(e) => setNewIp({ ...newIp, expires_in_hours: e.target.value })}
                  placeholder="Leave empty for permanent"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
                />
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Leave empty to block permanently
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlockIp}
                  className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#EF4444] text-white hover:opacity-90"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block IP
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
