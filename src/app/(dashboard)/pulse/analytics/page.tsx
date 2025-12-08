"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <ModulePageTemplate
      title="Analytics"
      description="Deep dive into your marketing performance data"
      icon={BarChart3}
      iconColor="#FF4757"
      backHref="/pulse"
      backLabel="Back to Pulse"
    />
  )
}
