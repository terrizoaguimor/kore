"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  Link2,
  UserCircle,
  Building2,
  Briefcase,
  HandshakeIcon,
  Receipt,
  DollarSign,
  Users,
  Target,
  Plus,
  Loader2,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useCRMDashboard, useDeals } from "@/hooks/use-crm"

const stageColors: Record<string, string> = {
  "Prospecting": "text-gray-400",
  "Qualification": "text-yellow-400",
  "Proposal": "text-blue-400",
  "Negotiation": "text-orange-400",
  "Closed Won": "text-green-400",
  "Closed Lost": "text-red-400",
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

export default function LinkPage() {
  const { stats, loading: statsLoading } = useCRMDashboard()
  const { deals, loading: dealsLoading, getPipelineStats } = useDeals()

  const pipelineStats = getPipelineStats()
  const recentDeals = deals.slice(0, 4)

  // Calculate win rate for display
  const winRate = pipelineStats.win_rate.toFixed(0)
  // Dynamic modules with real counts
  const modules = [
    {
      name: "Contacts",
      description: "Manage individual contacts and relationships",
      icon: UserCircle,
      href: "/link/contacts",
      count: statsLoading ? "-" : `${stats?.total_contacts || 0}`,
    },
    {
      name: "Companies",
      description: "Track organizations and accounts",
      icon: Building2,
      href: "/link/companies",
      count: statsLoading ? "-" : `${stats?.total_accounts || 0}`,
    },
    {
      name: "Deals",
      description: "Manage sales pipeline and opportunities",
      icon: Briefcase,
      href: "/link/deals",
      count: statsLoading ? "-" : `${stats?.total_deals || 0} Active`,
    },
    {
      name: "Leads",
      description: "Capture and nurture potential customers",
      icon: HandshakeIcon,
      href: "/link/leads",
      count: statsLoading ? "-" : `${stats?.total_leads || 0} New`,
    },
    {
      name: "Invoices",
      description: "Create and track invoices",
      icon: Receipt,
      href: "/link/invoices",
      count: statsLoading ? "-" : `${stats?.open_invoices || 0} Pending`,
    },
  ]

  return (
    <div className="min-h-full bg-[#0f1a4a] p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/20">
              <Link2 className="h-5 w-5 text-[#0046E2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">KORE Link</h1>
              <p className="text-sm text-[#A1A1AA]">CRM & Relationship Management</p>
            </div>
          </div>
        </motion.div>
        <Link href="/link/contacts">
          <button className="flex items-center gap-2 rounded-lg bg-[#0046E2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0046E2]/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Contact
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-[#243178] bg-[#243178] p-4">
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-[#A1A1AA]" />
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-[#A1A1AA]" />}
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {statsLoading ? "-" : stats?.total_contacts || 0}
          </p>
          <p className="text-sm text-[#A1A1AA]">Total Contacts</p>
        </div>

        <div className="rounded-xl border border-[#243178] bg-[#243178] p-4">
          <div className="flex items-center justify-between">
            <Briefcase className="h-5 w-5 text-[#A1A1AA]" />
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-[#A1A1AA]" />}
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {statsLoading ? "-" : stats?.total_deals || 0}
          </p>
          <p className="text-sm text-[#A1A1AA]">Active Deals</p>
        </div>

        <div className="rounded-xl border border-[#243178] bg-[#243178] p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-[#A1A1AA]" />
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-[#A1A1AA]" />}
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0046E2]">
            {statsLoading ? "-" : formatCurrency(stats?.pipeline_value || 0)}
          </p>
          <p className="text-sm text-[#A1A1AA]">Pipeline Value</p>
        </div>

        <div className="rounded-xl border border-[#243178] bg-[#243178] p-4">
          <div className="flex items-center justify-between">
            <Target className="h-5 w-5 text-[#A1A1AA]" />
            {dealsLoading && <Loader2 className="h-4 w-4 animate-spin text-[#A1A1AA]" />}
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {dealsLoading ? "-" : `${winRate}%`}
          </p>
          <p className="text-sm text-[#A1A1AA]">Win Rate</p>
        </div>
      </motion.div>

      {/* Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">CRM Tools</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.name} href={module.href}>
                <div className="group rounded-xl border border-[#243178] bg-[#243178] p-5 transition-all hover:border-[#0046E2]/30 hover:shadow-[0_0_20px_rgba(255,184,48,0.1)]">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/10">
                      <Icon className="h-5 w-5 text-[#0046E2]" />
                    </div>
                    <span className="rounded-full bg-[#0f1a4a] px-2 py-1 text-xs text-[#A1A1AA]">
                      {module.count}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{module.name}</h3>
                  <p className="mt-1 text-sm text-[#A1A1AA] line-clamp-2">{module.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Deals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Deals</h2>
          <Link href="/link/deals" className="text-sm text-[#0046E2] hover:underline">
            View all
          </Link>
        </div>
        <div className="rounded-xl border border-[#243178] bg-[#243178] divide-y divide-[#2d3c8a]">
          {dealsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0046E2]" />
            </div>
          ) : recentDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Briefcase className="h-10 w-10 text-[#A1A1AA] mb-2" />
              <p className="text-[#A1A1AA]">No deals yet</p>
              <Link href="/link/deals" className="mt-2 text-sm text-[#0046E2] hover:underline">
                Create your first deal
              </Link>
            </div>
          ) : (
            recentDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/10">
                    <Briefcase className="h-5 w-5 text-[#0046E2]" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{deal.deal_name}</p>
                    <p className="text-sm text-[#A1A1AA]">
                      {(deal as any).account?.account_name || "No account"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatCurrency(deal.amount || 0)}</p>
                    <p className="text-[#A1A1AA]">Value</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className={cn("font-medium", stageColors[deal.stage] || "text-gray-400")}>
                      {deal.stage}
                    </p>
                    <p className="text-[#A1A1AA]">{deal.probability || 0}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
