"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { PhoneOutgoing } from "lucide-react"

export default function OutgoingCallsPage() {
  return (
    <ModulePageTemplate
      title="Outgoing Calls"
      description="Track outbound calls and campaigns"
      icon={PhoneOutgoing}
      iconColor="#0046E2"
      backHref="/voice"
      backLabel="Back to Voice"
      actionLabel="New Campaign"
    />
  )
}
