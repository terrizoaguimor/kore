"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  Megaphone,
  Share2,
  BarChart3,
  Mail,
  Target,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  ArrowUpRight,
  Calendar,
  Plus,
  FileText,
  Zap,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const stats = [
  {
    name: "Alcance Total",
    value: "124.5K",
    change: "+12.3%",
    trend: "up",
    icon: Eye,
  },
  {
    name: "Tasa de Engagement",
    value: "4.8%",
    change: "+0.8%",
    trend: "up",
    icon: MousePointer,
  },
  {
    name: "Seguidores",
    value: "45.2K",
    change: "+2.1K",
    trend: "up",
    icon: Users,
  },
  {
    name: "Conversiones",
    value: "892",
    change: "-3.2%",
    trend: "down",
    icon: Target,
  },
]

const modules = [
  {
    name: "Campañas",
    description: "Crea y gestiona campañas de marketing",
    icon: Megaphone,
    href: "/pulse/campaigns",
    count: "12 Activas",
  },
  {
    name: "Plantillas",
    description: "Plantillas reutilizables para tus campañas",
    icon: FileText,
    href: "/pulse/templates",
    count: "6 Plantillas",
  },
  {
    name: "Automatizaciones",
    description: "Flujos de trabajo automatizados",
    icon: Zap,
    href: "/pulse/automation",
    count: "4 Activas",
  },
  {
    name: "Contenido IA",
    description: "Genera contenido con inteligencia artificial",
    icon: Sparkles,
    href: "/pulse/ai",
    count: "Nuevo",
  },
  {
    name: "Redes Sociales",
    description: "Gestiona tu presencia en redes sociales",
    icon: Share2,
    href: "/pulse/social",
    count: "4 Plataformas",
  },
  {
    name: "Analíticas",
    description: "Analiza el rendimiento de tus campañas",
    icon: BarChart3,
    href: "/pulse/analytics",
    count: "Tiempo Real",
  },
  {
    name: "Email Marketing",
    description: "Crea y envía campañas de email",
    icon: Mail,
    href: "/pulse/email",
    count: "3 Programadas",
  },
  {
    name: "Audiencia",
    description: "Segmenta y comprende tu audiencia",
    icon: Target,
    href: "/pulse/audience",
    count: "8 Segmentos",
  },
]

const recentCampaigns = [
  { name: "Promoción Verano 2024", status: "active", reach: "45.2K", engagement: "5.2%" },
  { name: "Lanzamiento Producto Q1", status: "scheduled", reach: "-", engagement: "-" },
  { name: "Reconocimiento de Marca", status: "active", reach: "28.1K", engagement: "3.8%" },
  { name: "Retención de Clientes", status: "completed", reach: "12.4K", engagement: "6.1%" },
]

export default function PulsePage() {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF4757]/20">
              <Activity className="h-5 w-5 text-[#FF4757]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">KORE Pulse</h1>
              <p className="text-sm text-[#A1A1AA]">Marketing & Social Media Hub</p>
            </div>
          </div>
        </motion.div>
        <Link
          href="/pulse/campaigns"
          className="flex items-center gap-2 rounded-lg bg-[#FF4757] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF4757]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </Link>
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
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    stat.trend === "up" ? "text-[#00D68F]" : "text-[#FF4757]"
                  )}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
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
        <h2 className="mb-4 text-lg font-semibold text-white">Herramientas de Marketing</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.name} href={module.href}>
                <div className="group rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-5 transition-all hover:border-[#FF4757]/30 hover:shadow-[0_0_20px_rgba(255,71,87,0.1)]">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF4757]/10">
                      <Icon className="h-5 w-5 text-[#FF4757]" />
                    </div>
                    <span className="rounded-full bg-[#0B0B0B] px-2 py-1 text-xs text-[#A1A1AA]">
                      {module.count}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{module.name}</h3>
                  <p className="mt-1 text-sm text-[#A1A1AA]">{module.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Campañas Recientes</h2>
          <Link href="/pulse/campaigns" className="text-sm text-[#FF4757] hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] divide-y divide-[#2A2A2A]">
          {recentCampaigns.map((campaign, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B0B0B]">
                  <Megaphone className="h-5 w-5 text-[#FF4757]" />
                </div>
                <div>
                  <p className="font-medium text-white">{campaign.name}</p>
                  <span
                    className={cn(
                      "text-xs capitalize",
                      campaign.status === "active"
                        ? "text-[#00D68F]"
                        : campaign.status === "scheduled"
                        ? "text-[#FFB830]"
                        : "text-[#A1A1AA]"
                    )}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="text-right">
                  <p className="text-white">{campaign.reach}</p>
                  <p className="text-[#A1A1AA]">Alcance</p>
                </div>
                <div className="text-right">
                  <p className="text-white">{campaign.engagement}</p>
                  <p className="text-[#A1A1AA]">Interacción</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
