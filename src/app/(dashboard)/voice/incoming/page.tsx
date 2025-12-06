"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { PhoneIncoming } from "lucide-react"

export default function IncomingCallsPage() {
  return (
    <ModulePageTemplate
      title="Incoming Calls"
      description="View and manage incoming call history"
      icon={PhoneIncoming}
      iconColor="#9B59B6"
      backHref="/voice"
      backLabel="Back to Voice"
    />
  )
}
