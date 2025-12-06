"use client"

import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Mail, Eye, MousePointer, Users,
  DollarSign, Target
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CampaignAnalytics as CampaignAnalyticsType } from "@/types/marketing"

interface CampaignAnalyticsProps {
  analytics: CampaignAnalyticsType
  accentColor?: string
}

export function CampaignAnalytics({ analytics, accentColor = "#FF6B6B" }: CampaignAnalyticsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const metrics = [
    {
      label: 'Enviados',
      value: analytics.metrics.sent,
      icon: Mail,
      color: '#A1A1AA',
      description: 'Total de mensajes enviados',
    },
    {
      label: 'Entregados',
      value: analytics.metrics.delivered,
      icon: Mail,
      color: '#22C55E',
      description: `${analytics.metrics.sent > 0 ? ((analytics.metrics.delivered / analytics.metrics.sent) * 100).toFixed(1) : 0}% tasa de entrega`,
    },
    {
      label: 'Abiertos',
      value: analytics.metrics.opened,
      icon: Eye,
      color: '#3B82F6',
      description: `${analytics.performance.openRate}% tasa de apertura`,
    },
    {
      label: 'Clicks',
      value: analytics.metrics.clicked,
      icon: MousePointer,
      color: '#8B5CF6',
      description: `${analytics.performance.clickRate}% CTR`,
    },
    {
      label: 'Leads',
      value: analytics.metrics.leads,
      icon: Users,
      color: '#F59E0B',
      description: `${formatCurrency(analytics.performance.costPerLead)} por lead`,
    },
    {
      label: 'Conversiones',
      value: analytics.metrics.conversions,
      icon: Target,
      color: '#EF4444',
      description: `${analytics.performance.conversionRate}% conversión`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{analytics.campaignName}</h2>
          <p className="text-[#A1A1AA]">Análisis de rendimiento de campaña</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" style={{ color: metric.color }} />
                    <span className="text-xs text-[#A1A1AA]">{metric.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metric.value)}
                  </p>
                  <p className="text-xs text-[#A1A1AA] mt-1">{metric.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ROI Card */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" style={{ color: accentColor }} />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <p className={`text-4xl font-bold ${
                analytics.performance.roi >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {analytics.performance.roi >= 0 ? '+' : ''}{analytics.performance.roi}%
              </p>
              {analytics.performance.roi >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400 mb-1" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400 mb-1" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Costo por Lead</span>
                <span className="text-white">{formatCurrency(analytics.performance.costPerLead)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Target className="h-5 w-5" style={{ color: accentColor }} />
              Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A1A1AA]">Leads</span>
                <span className="text-white">{analytics.progress.leadsProgress}%</span>
              </div>
              <Progress
                value={analytics.progress.leadsProgress}
                className="h-2 bg-[#2A2A2A]"
                style={{ '--progress-color': accentColor } as React.CSSProperties}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A1A1AA]">Conversiones</span>
                <span className="text-white">{analytics.progress.conversionsProgress}%</span>
              </div>
              <Progress
                value={analytics.progress.conversionsProgress}
                className="h-2 bg-[#2A2A2A]"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
