"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { Share2 } from "lucide-react"

export default function SocialMediaPage() {
  return (
    <ModulePageTemplate
      title="Social Media"
      description="Manage your social media presence across all platforms"
      icon={Share2}
      iconColor="#FF4757"
      backHref="/pulse"
      backLabel="Back to Pulse"
      actionLabel="Connect Account"
    />
  )
}
