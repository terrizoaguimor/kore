"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { Mail } from "lucide-react"

export default function EmailMarketingPage() {
  return (
    <ModulePageTemplate
      title="Email Marketing"
      description="Create, schedule and send email campaigns"
      icon={Mail}
      iconColor="#FF6B6B"
      backHref="/pulse"
      backLabel="Back to Pulse"
      actionLabel="New Email"
    />
  )
}
