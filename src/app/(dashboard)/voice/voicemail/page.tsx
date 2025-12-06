"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { Voicemail } from "lucide-react"

export default function VoicemailPage() {
  return (
    <ModulePageTemplate
      title="Voicemail"
      description="Listen to and manage voicemail messages"
      icon={Voicemail}
      iconColor="#9B59B6"
      backHref="/voice"
      backLabel="Back to Voice"
    />
  )
}
