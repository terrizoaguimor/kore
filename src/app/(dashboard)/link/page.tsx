"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Link2,
  UserCircle,
  Building2,
  Briefcase,
  HandshakeIcon,
  Receipt,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Plus,
  ArrowUpRight,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const stats = [
  {
    name: "Total Contacts",
    value: "892",
    change: "+24",
    icon: Users,
  },
  {
    name: "Active Deals",
    value: "34",
    change: "+5",
    icon: Briefcase,
  },
  {
    name: "Pipeline Value",
    value: "$1.2M",
    change: "+$180K",
    icon: DollarSign,
  },
  {
    name: "Conversion Rate",
    value: "24%",
    change: "+3%",
    icon: Target,
  },
]

const modules = [
  {
    name: "Contacts",
    description: "Manage individual contacts and relationships",
    icon: UserCircle,
    href: "/link/contacts",
    count: "892",
  },
  {
    name: "Companies",
    description: "Track organizations and accounts",
    icon: Building2,
    href: "/link/companies",
    count: "156",
  },
  {
    name: "Deals",
    description: "Manage sales pipeline and opportunities",
    icon: Briefcase,
    href: "/link/deals",
    count: "34 Active",
  },
  {
    name: "Leads",
    description: "Capture and nurture potential customers",
    icon: HandshakeIcon,
    href: "/link/leads",
    count: "128 New",
  },
  {
    name: "Invoices",
    description: "Create and track invoices",
    icon: Receipt,
    href: "/link/invoices",
    count: "12 Pending",
  },
]

const recentDeals = [
  { name: "Enterprise Package", company: "Acme Corp", value: "$45,000", stage: "Negotiation", probability: "75%" },
  { name: "Annual Subscription", company: "Tech Solutions", value: "$12,000", stage: "Proposal", probability: "50%" },
  { name: "Custom Integration", company: "Global Industries", value: "$28,000", stage: "Qualification", probability: "25%" },
  { name: "Premium Support", company: "StartupXYZ", value: "$8,500", stage: "Closed Won", probability: "100%" },
]

const stageColors: Record<string, string> = {
  "Qualification": "text-yellow-400",
  "Proposal": "text-blue-400",
  "Negotiation": "text-orange-400",
  "Closed Won": "text-green-400",
  "Closed Lost": "text-red-400",
}

export default function LinkPage() {
  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F39C12]/20">
              <Link2 className="h-5 w-5 text-[#F39C12]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">KORE Link</h1>
              <p className="text-sm text-[#A1A1AA]">CRM & Relationship Management</p>
            </div>
          </div>
        </motion.div>
        <button className="flex items-center gap-2 rounded-lg bg-[#F39C12] px-4 py-2 text-sm font-medium text-white hover:bg-[#F39C12]/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Contact
        </button>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-[#A1A1AA]" />
                <span className="text-xs font-medium text-green-400">
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-[#A1A1AA]">{stat.name}</p>
            </div>
          )
        })}
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
                <div className="group rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-5 transition-all hover:border-[#F39C12]/30 hover:shadow-[0_0_20px_rgba(243,156,18,0.1)]">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F39C12]/10">
                      <Icon className="h-5 w-5 text-[#F39C12]" />
                    </div>
                    <span className="rounded-full bg-[#0B0B0B] px-2 py-1 text-xs text-[#A1A1AA]">
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
          <Link href="/link/deals" className="text-sm text-[#F39C12] hover:underline">
            View all
          </Link>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] divide-y divide-[#2A2A2A]">
          {recentDeals.map((deal, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F39C12]/10">
                  <Briefcase className="h-5 w-5 text-[#F39C12]" />
                </div>
                <div>
                  <p className="font-medium text-white">{deal.name}</p>
                  <p className="text-sm text-[#A1A1AA]">{deal.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="text-right">
                  <p className="text-white font-semibold">{deal.value}</p>
                  <p className="text-[#A1A1AA]">Value</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className={cn("font-medium", stageColors[deal.stage])}>{deal.stage}</p>
                  <p className="text-[#A1A1AA]">{deal.probability}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
