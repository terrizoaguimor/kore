"use client"

import { ModulePageTemplate } from "@/components/module-page-template"
import { UserCircle } from "lucide-react"

export default function CRMContactsPage() {
  return (
    <ModulePageTemplate
      title="Contacts"
      description="Manage individual contacts and relationships"
      icon={UserCircle}
      iconColor="#F39C12"
      backHref="/link"
      backLabel="Back to Link"
      actionLabel="New Contact"
    />
  )
}
