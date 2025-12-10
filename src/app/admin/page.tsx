"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Building2,
  HardDrive,
  FileText,
  Calendar,
  MessageSquare,
  CheckSquare,
  StickyNote,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Globe,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatBytes } from "@/lib/utils"
import { motion } from "motion/react"

interface Stats {
  users: number
  organizations: number
  files: number
  events: number
  contacts: number
  messages: number
  tasks: number
  notes: number
  storage: {
    used: number
    quota: number
  }
}

interface RecentActivity {
  id: string
  action: string
  entity_type: string
  user_name: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const [
        { count: usersCount },
        { count: orgsCount },
        { count: filesCount },
        { count: eventsCount },
        { count: contactsCount },
        { count: messagesCount },
        { count: tasksCount },
        { count: notesCount },
        { data: storageData },
        { data: activityData },
      ] = await Promise.all([
        sb.from("users").select("*", { count: "exact", head: true }),
        sb.from("organizations").select("*", { count: "exact", head: true }),
        sb.from("files").select("*", { count: "exact", head: true }).eq("type", "file"),
        sb.from("calendar_events").select("*", { count: "exact", head: true }),
        sb.from("contacts").select("*", { count: "exact", head: true }),
        sb.from("chat_messages").select("*", { count: "exact", head: true }),
        sb.from("tasks").select("*", { count: "exact", head: true }),
        sb.from("notes").select("*", { count: "exact", head: true }),
        sb.from("organizations").select("storage_used, storage_quota"),
        sb.from("activity_logs").select("id, action, entity_type, created_at, user:users(full_name)").order("created_at", { ascending: false }).limit(5),
      ])

      const totalStorage = storageData?.reduce((acc: number, org: { storage_used?: number }) => acc + (org.storage_used || 0), 0) || 0
      const totalQuota = storageData?.reduce((acc: number, org: { storage_quota?: number }) => acc + (org.storage_quota || 0), 0) || 0

      setStats({
        users: usersCount || 0,
        organizations: orgsCount || 0,
        files: filesCount || 0,
        events: eventsCount || 0,
        contacts: contactsCount || 0,
        messages: messagesCount || 0,
        tasks: tasksCount || 0,
        notes: notesCount || 0,
        storage: {
          used: totalStorage,
          quota: totalQuota,
        },
      })

      setRecentActivity(activityData?.map((item: any) => ({
        id: item.id,
        action: item.action,
        entity_type: item.entity_type,
        user_name: item.user?.full_name || "Unknown",
        created_at: item.created_at,
      })) || [])

      setIsLoading(false)
    }

    fetchStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      color: "#00E5FF",
      gradient: "from-[#00E5FF] to-[#0EA5E9]",
      change: "+12%",
      trend: "up",
    },
    {
      title: "Organizations",
      value: stats.organizations,
      icon: Building2,
      color: "#8B5CF6",
      gradient: "from-[#8B5CF6] to-[#7C3AED]",
      change: "+8%",
      trend: "up",
    },
    {
      title: "Files",
      value: stats.files,
      icon: FileText,
      color: "#10B981",
      gradient: "from-[#10B981] to-[#059669]",
      change: "+24%",
      trend: "up",
    },
    {
      title: "Messages",
      value: stats.messages,
      icon: MessageSquare,
      color: "#FFB830",
      gradient: "from-[#FFB830] to-[#F59E0B]",
      change: "+45%",
      trend: "up",
    },
  ]

  const secondaryStats = [
    { title: "Calendar Events", value: stats.events, icon: Calendar },
    { title: "Contacts", value: stats.contacts, icon: Users },
    { title: "Tasks", value: stats.tasks, icon: CheckSquare },
    { title: "Notes", value: stats.notes, icon: StickyNote },
  ]

  const storagePercentage = stats.storage.quota > 0
    ? Math.min((stats.storage.used / stats.storage.quota) * 100, 100)
    : 0

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-[#A1A1AA] mt-1">
          Monitor and manage your KORE platform
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(135deg, ${stat.color}10, ${stat.color}05)` }}
            />
            <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === "up" ? "text-[#10B981]" : "text-[#FF6B6B]"}`}>
                  {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Storage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#8B5CF6]">
                <HardDrive className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Storage Usage</h2>
                <p className="text-sm text-[#A1A1AA]">Total across all organizations</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{formatBytes(stats.storage.used)}</p>
              <p className="text-sm text-[#A1A1AA]">of {formatBytes(stats.storage.quota)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-4 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#8B5CF6]"
              />
            </div>
            <div className="flex justify-between text-xs text-[#A1A1AA]">
              <span>{storagePercentage.toFixed(1)}% used</span>
              <span>{formatBytes(stats.storage.quota - stats.storage.used)} available</span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
            {secondaryStats.map((stat) => (
              <div key={stat.title} className="text-center">
                <stat.icon className="h-5 w-5 text-[#A1A1AA] mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-[#A1A1AA]">{stat.title}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB830] to-[#F59E0B]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-[#A1A1AA]">Latest system events</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                    <Globe className="h-4 w-4 text-[#A1A1AA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="font-medium">{activity.user_name}</span>
                      {" "}{activity.action}{" "}
                      <span className="text-[#A1A1AA]">{activity.entity_type}</span>
                    </p>
                    <p className="text-xs text-[#A1A1AA] flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-[#A1A1AA] mx-auto mb-2" />
                <p className="text-sm text-[#A1A1AA]">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/10 to-[#FF6B6B]/10 border border-white/10"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Create Organization", href: "/admin/organizations/new", icon: Building2, color: "#8B5CF6" },
            { title: "Invite User", href: "/admin/users/invite", icon: Users, color: "#00E5FF" },
            { title: "View Logs", href: "/admin/logs", icon: Activity, color: "#FFB830" },
            { title: "Storage Settings", href: "/admin/storage", icon: HardDrive, color: "#10B981" },
          ].map((action) => (
            <a
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
              <span className="text-sm font-medium text-white group-hover:text-[#00E5FF] transition-colors">
                {action.title}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#A1A1AA] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
