"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { Target } from "lucide-react"

export default function AudiencePage() {
  return (
    <ModulePageTemplate
      title="Audience"
      description="Understand and segment your audience for targeted campaigns"
      icon={Target}
      iconColor="#FF6B6B"
      backHref="/pulse"
      backLabel="Back to Pulse"
      actionLabel="New Segment"
    />
  )
}
