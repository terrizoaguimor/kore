"use client"

import { useState } from "react"
import { Metadata } from "next"
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  Brain,
  Link2,
  Phone,
  Video,
  HardDrive,
  LayoutDashboard,
  ClipboardList,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for services status
const services = [
  {
    name: "The Core",
    description: "AI Assistant & Automation",
    icon: Brain,
    status: "operational",
    uptime: "99.99%",
    latency: "45ms",
    gradient: "from-[#00E5FF] to-[#0EA5E9]",
  },
  {
    name: "KORE Link",
    description: "CRM & Relationships",
    icon: Link2,
    status: "operational",
    uptime: "99.98%",
    latency: "32ms",
    gradient: "from-[#FFB830] to-[#F59E0B]",
  },
  {
    name: "KORE Voice",
    description: "Telephony & WhatsApp",
    icon: Phone,
    status: "operational",
    uptime: "99.95%",
    latency: "28ms",
    gradient: "from-[#8B5CF6] to-[#7C3AED]",
  },
  {
    name: "KORE Meet",
    description: "Video Conferencing",
    icon: Video,
    status: "operational",
    uptime: "99.97%",
    latency: "52ms",
    gradient: "from-[#10B981] to-[#059669]",
  },
  {
    name: "KORE Pulse",
    description: "Marketing Hub",
    icon: Activity,
    status: "operational",
    uptime: "99.96%",
    latency: "38ms",
    gradient: "from-[#FF6B6B] to-[#EF4444]",
  },
  {
    name: "KORE Planning",
    description: "Projects & Tasks",
    icon: ClipboardList,
    status: "operational",
    uptime: "99.99%",
    latency: "25ms",
    gradient: "from-[#14B8A6] to-[#0D9488]",
  },
  {
    name: "KORE Drive",
    description: "File Storage",
    icon: HardDrive,
    status: "operational",
    uptime: "99.99%",
    latency: "42ms",
    gradient: "from-[#00E5FF] to-[#0EA5E9]",
  },
  {
    name: "KORE OS",
    description: "Dashboard & Analytics",
    icon: LayoutDashboard,
    status: "operational",
    uptime: "99.98%",
    latency: "30ms",
    gradient: "from-[#06B6D4] to-[#0891B2]",
  },
]

const infrastructure = [
  {
    name: "API Gateway",
    icon: Server,
    status: "operational",
    region: "Global",
  },
  {
    name: "Database Cluster",
    icon: Database,
    status: "operational",
    region: "US-East, EU-West",
  },
  {
    name: "CDN",
    icon: Globe,
    status: "operational",
    region: "Global (150+ PoPs)",
  },
  {
    name: "Authentication",
    icon: Shield,
    status: "operational",
    region: "Global",
  },
  {
    name: "Real-time Engine",
    icon: Zap,
    status: "operational",
    region: "Global",
  },
]

// Mock incident history
const recentIncidents = [
  {
    date: "December 5, 2025",
    title: "Scheduled Maintenance Completed",
    status: "resolved",
    description: "Database optimization completed successfully. No downtime experienced.",
    duration: "2 hours",
  },
  {
    date: "November 28, 2025",
    title: "Minor API Latency",
    status: "resolved",
    description: "Brief increase in API response times due to traffic spike. Auto-scaling resolved the issue.",
    duration: "15 minutes",
  },
  {
    date: "November 15, 2025",
    title: "Scheduled Maintenance",
    status: "resolved",
    description: "Infrastructure upgrades to improve performance. All systems operational.",
    duration: "1 hour",
  },
]

// Generate mock uptime data for the last 90 days
const generateUptimeData = () => {
  const data = []
  for (let i = 89; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    // 99.5% chance of being fully operational
    const random = Math.random()
    let status: "operational" | "degraded" | "outage" = "operational"
    if (random > 0.995) status = "degraded"
    if (random > 0.999) status = "outage"
    data.push({
      date: date.toISOString().split("T")[0],
      status,
    })
  }
  return data
}

const uptimeData = generateUptimeData()

const getStatusIcon = (status: string) => {
  switch (status) {
    case "operational":
      return <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
    case "degraded":
      return <AlertCircle className="h-5 w-5 text-[#FFB830]" />
    case "outage":
      return <XCircle className="h-5 w-5 text-[#EF4444]" />
    default:
      return <Clock className="h-5 w-5 text-[#A1A1AA]" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "operational":
      return "bg-[#10B981]"
    case "degraded":
      return "bg-[#FFB830]"
    case "outage":
      return "bg-[#EF4444]"
    default:
      return "bg-[#A1A1AA]"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "operational":
      return "Operational"
    case "degraded":
      return "Degraded"
    case "outage":
      return "Outage"
    default:
      return "Unknown"
  }
}

export default function StatusPage() {
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const allOperational = services.every((s) => s.status === "operational") &&
    infrastructure.every((i) => i.status === "operational")

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className={cn(
          "inline-flex items-center justify-center h-20 w-20 rounded-3xl mb-6",
          allOperational
            ? "bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5"
            : "bg-gradient-to-br from-[#FFB830]/20 to-[#FFB830]/5"
        )}>
          {allOperational ? (
            <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
          ) : (
            <AlertCircle className="h-10 w-10 text-[#FFB830]" />
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          System Status
        </h1>
        <p className={cn(
          "text-xl font-medium",
          allOperational ? "text-[#10B981]" : "text-[#FFB830]"
        )}>
          {allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}
        </p>
        <p className="text-sm text-[#A1A1AA] mt-4">
          Last checked: {new Date().toLocaleString()}
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#A1A1AA] hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Status
        </button>
      </div>

      {/* 90-Day Uptime Graph */}
      <div className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">90-Day Uptime</h2>
          <span className="text-2xl font-bold text-[#10B981]">99.98%</span>
        </div>
        <div className="flex gap-[2px]">
          {uptimeData.map((day, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-8 rounded-sm transition-all hover:scale-y-125 cursor-pointer group relative",
                getStatusColor(day.status)
              )}
              title={`${day.date}: ${getStatusText(day.status)}`}
            >
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap">
                  {day.date}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-[#A1A1AA]">
          <span>90 days ago</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#10B981]" /> Operational
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#FFB830]" /> Degraded
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#EF4444]" /> Outage
            </span>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Services Status */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Services</h2>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    service.gradient
                  )}>
                    <service.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{service.name}</h3>
                    <p className="text-sm text-[#A1A1AA]">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-[#A1A1AA]">Uptime</p>
                    <p className="text-sm font-medium text-white">{service.uptime}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-[#A1A1AA]">Latency</p>
                    <p className="text-sm font-medium text-white">{service.latency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <span className={cn(
                      "text-sm font-medium",
                      service.status === "operational" ? "text-[#10B981]" : "text-[#FFB830]"
                    )}>
                      {getStatusText(service.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Status */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Infrastructure</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {infrastructure.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-[#00E5FF]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{item.name}</h3>
                    <p className="text-xs text-[#A1A1AA]">{item.region}</p>
                  </div>
                </div>
                {getStatusIcon(item.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Recent Incidents</h2>
        <div className="space-y-3">
          {recentIncidents.map((incident, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedIncident(expandedIncident === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    incident.status === "resolved" ? "bg-[#10B981]" : "bg-[#FFB830]"
                  )} />
                  <div>
                    <h3 className="font-medium text-white">{incident.title}</h3>
                    <p className="text-sm text-[#A1A1AA]">{incident.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    incident.status === "resolved"
                      ? "bg-[#10B981]/20 text-[#10B981]"
                      : "bg-[#FFB830]/20 text-[#FFB830]"
                  )}>
                    {incident.status === "resolved" ? "Resolved" : "Investigating"}
                  </span>
                  {expandedIncident === index ? (
                    <ChevronUp className="h-4 w-4 text-[#A1A1AA]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#A1A1AA]" />
                  )}
                </div>
              </button>
              {expandedIncident === index && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-6 border-l-2 border-white/10 ml-1">
                    <p className="text-sm text-[#A1A1AA] mb-2">{incident.description}</p>
                    <p className="text-xs text-[#A1A1AA]">
                      Duration: <span className="text-white">{incident.duration}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe to Updates */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#00E5FF]/10 to-[#8B5CF6]/10 border border-white/10">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Subscribe to Updates</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">
            Get notified about scheduled maintenance and incidents
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
            />
            <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-medium hover:shadow-lg hover:shadow-[#00E5FF]/25 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
