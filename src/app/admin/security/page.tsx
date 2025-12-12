"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Shield,
  AlertTriangle,
  Eye,
  Ban,
  Activity,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Zap,
  Bot,
  Users,
  Server,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"
import Link from "next/link"

interface SecurityStats {
  totalVisits: number
  uniqueIps: number
  suspiciousRequests: number
  blockedIps: number
  topThreats: Array<{ threat_level: string; count: number }>
  topPaths: Array<{ path: string; count: number }>
  topIps: Array<{ ip_address: string; count: number; is_suspicious: boolean }>
  recentAlerts: Array<{ alert_type: string; severity: string; description: string; created_at: string }>
  botStats: {
    totalBots: number
    aiBots: number
    scrapers: number
    blockedBots: number
  }
  threatsByHour: Array<{ hour: string; count: number }>
  countriesStats: Array<{ country: string; count: number; suspicious: number }>
}

export default function AdminSecurityPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(24)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/security/stats?hours=${timeRange}`)
      if (!response.ok) throw new Error("Failed to fetch stats")
      const { data } = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching security stats:", error)
      toast.error("Failed to load security statistics")
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchStats])

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical": return "text-[#FF6B6B] bg-[#FF6B6B]/10"
      case "high": return "text-[#F59E0B] bg-[#F59E0B]/10"
      case "medium": return "text-[#0046E2] bg-[#0046E2]/10"
      case "low": return "text-[#0046E2] bg-[#0046E2]/10"
      default: return "text-[#10B981] bg-[#10B981]/10"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-[#FF6B6B] bg-[#FF6B6B]/10 border-[#FF6B6B]/30"
      case "high": return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
      case "warning": return "text-[#0046E2] bg-[#0046E2]/10 border-[#0046E2]/30"
      default: return "text-[#0046E2] bg-[#0046E2]/10 border-[#0046E2]/30"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
      </div>
    )
  }

  const mainStats = [
    {
      title: "Total Visits",
      value: stats?.totalVisits || 0,
      icon: Eye,
      color: "#0046E2",
      gradient: "from-[#0046E2] to-[#1A5AE8]",
    },
    {
      title: "Unique IPs",
      value: stats?.uniqueIps || 0,
      icon: Users,
      color: "#1b2d7c",
      gradient: "from-[#1b2d7c] to-[#7C3AED]",
    },
    {
      title: "Suspicious",
      value: stats?.suspiciousRequests || 0,
      icon: AlertTriangle,
      color: "#0046E2",
      gradient: "from-[#0046E2] to-[#F59E0B]",
    },
    {
      title: "Blocked IPs",
      value: stats?.blockedIps || 0,
      icon: Ban,
      color: "#FF6B6B",
      gradient: "from-[#FF6B6B] to-[#EF4444]",
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#EF4444]">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">KORE Security</h1>
            <p className="text-[#A1A1AA] mt-1">
              Real-time threat monitoring and protection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
          >
            <option value="1" className="bg-[#1b2d7c]">Last hour</option>
            <option value="6" className="bg-[#1b2d7c]">Last 6 hours</option>
            <option value="24" className="bg-[#1b2d7c]">Last 24 hours</option>
            <option value="168" className="bg-[#1b2d7c]">Last 7 days</option>
          </select>
          <Button
            onClick={() => { setIsLoading(true); fetchStats() }}
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-[#A1A1AA]">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1b2d7c] to-[#FF6B6B]">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bot Activity</h2>
              <p className="text-sm text-[#A1A1AA]">AI bots and scrapers detected</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white">{stats?.botStats.totalBots || 0}</p>
              <p className="text-xs text-[#A1A1AA]">Total Bots</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-[#1b2d7c]">{stats?.botStats.aiBots || 0}</p>
              <p className="text-xs text-[#A1A1AA]">AI Bots</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-[#0046E2]">{stats?.botStats.scrapers || 0}</p>
              <p className="text-xs text-[#A1A1AA]">Scrapers</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-[#FF6B6B]">{stats?.botStats.blockedBots || 0}</p>
              <p className="text-xs text-[#A1A1AA]">Blocked</p>
            </div>
          </div>
        </motion.div>

        {/* Top Threats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#EF4444]">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Threat Levels</h2>
              <p className="text-sm text-[#A1A1AA]">Breakdown by severity</p>
            </div>
          </div>

          <div className="space-y-3">
            {(stats?.topThreats || []).length > 0 ? (
              stats?.topThreats.map((threat) => (
                <div
                  key={threat.threat_level}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <span className={cn("px-3 py-1 rounded-lg text-xs font-medium capitalize", getThreatColor(threat.threat_level))}>
                    {threat.threat_level}
                  </span>
                  <span className="text-lg font-semibold text-white">{threat.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="h-8 w-8 text-[#10B981] mx-auto mb-2" />
                <p className="text-sm text-[#A1A1AA]">No threats detected</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0046E2] to-[#F59E0B]">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
              <p className="text-sm text-[#A1A1AA]">Latest security events</p>
            </div>
          </div>
          <Link
            href="/admin/security/alerts"
            className="text-sm text-[#0046E2] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {(stats?.recentAlerts || []).length > 0 ? (
            stats?.recentAlerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border",
                  getSeverityColor(alert.severity)
                )}
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {alert.description}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    {alert.alert_type} • {format(new Date(alert.created_at), "MMM d, HH:mm")}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg text-xs font-medium capitalize bg-white/10">
                  {alert.severity}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-[#A1A1AA] mx-auto mb-2" />
              <p className="text-sm text-[#A1A1AA]">No recent alerts</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-[#FF6B6B]/10 to-[#1b2d7c]/10 border border-white/10"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Security Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Blocked IPs", href: "/admin/security/blocked-ips", icon: Ban, color: "#FF6B6B" },
            { title: "Security Alerts", href: "/admin/security/alerts", icon: AlertTriangle, color: "#0046E2" },
            { title: "Traffic Monitor", href: "/admin/security/traffic", icon: Globe, color: "#0046E2" },
            { title: "Activity Logs", href: "/admin/logs", icon: Activity, color: "#1b2d7c" },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <action.icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <span className="text-sm font-medium text-white group-hover:text-[#0046E2] transition-colors">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
