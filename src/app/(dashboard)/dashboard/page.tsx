"use client"

import { useAuthStore } from "@/stores/auth-store"
import {
  LayoutDashboard,
  HardDrive,
  Activity,
  Phone,
  Link2,
  Brain,
  ArrowUpRight,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"

const modules = [
  {
    name: "KORE Drive",
    description: "Files, Calendar, Contacts & More",
    icon: HardDrive,
    href: "/files",
    color: "#00E5FF",
    stats: { label: "Files", value: "1,234" },
  },
  {
    name: "KORE Pulse",
    description: "Marketing & Social Media",
    icon: Activity,
    href: "/pulse",
    color: "#FF6B6B",
    stats: { label: "Campaigns", value: "12" },
  },
  {
    name: "KORE Voice",
    description: "Telephony & Communications",
    icon: Phone,
    href: "/voice",
    color: "#9B59B6",
    stats: { label: "Calls Today", value: "48" },
  },
  {
    name: "KORE Link",
    description: "CRM & Relationships",
    icon: Link2,
    href: "/link",
    color: "#F39C12",
    stats: { label: "Contacts", value: "892" },
  },
]

const quickStats = [
  { label: "Active Users", value: "24", icon: Users, change: "+12%" },
  { label: "Documents", value: "1,234", icon: FileText, change: "+8%" },
  { label: "Meetings Today", value: "6", icon: Calendar, change: "0%" },
  { label: "Messages", value: "128", icon: MessageSquare, change: "+23%" },
]

export default function DashboardPage() {
  const { user, organization } = useAuthStore()

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="mt-2 text-[#A1A1AA]">
            {organization?.name || "Your organization"} • KORE // OS Dashboard
          </p>
        </motion.div>
      </div>

      {/* The Core AI Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <Link href="/core">
          <div className="relative overflow-hidden rounded-xl border border-[#00E5FF]/30 bg-gradient-to-r from-[#00E5FF]/20 via-[#00E5FF]/10 to-transparent p-6 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#00E5FF]/20 group-hover:bg-[#00E5FF]/30 transition-colors">
                  <Brain className="h-7 w-7 text-[#00E5FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">The Core</h2>
                  <p className="text-[#A1A1AA]">Ask the AI for insights, strategy suggestions, or help with any task</p>
                </div>
              </div>
              <ArrowUpRight className="h-6 w-6 text-[#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Animated background */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#00E5FF]/10 blur-[80px]" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-[#A1A1AA]" />
                <span className={`text-xs font-medium ${
                  stat.change.startsWith("+") ? "text-green-400" : "text-[#A1A1AA]"
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-[#A1A1AA]">{stat.label}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Module Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-white">KORE Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module, index) => {
            const Icon = module.icon
            return (
              <Link key={module.name} href={module.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-5 transition-all hover:border-opacity-50"
                  style={{ borderColor: `${module.color}30` }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: module.color }} />
                    </div>
                    <ArrowUpRight
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: module.color }}
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{module.name}</h3>
                  <p className="mt-1 text-sm text-[#A1A1AA]">{module.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{module.stats.value}</span>
                    <span className="text-sm text-[#A1A1AA]">{module.stats.label}</span>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] divide-y divide-[#2A2A2A]">
          {[
            { action: "File uploaded", detail: "Q4-Report.pdf", time: "2 min ago", module: "Drive" },
            { action: "Campaign launched", detail: "Holiday Sale 2024", time: "1 hour ago", module: "Pulse" },
            { action: "New lead added", detail: "Acme Corporation", time: "3 hours ago", module: "Link" },
            { action: "Call completed", detail: "+1 (555) 123-4567", time: "4 hours ago", module: "Voice" },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-white">{item.action}</p>
                <p className="text-sm text-[#A1A1AA]">{item.detail}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#00E5FF]">{item.module}</span>
                <p className="text-xs text-[#A1A1AA]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
