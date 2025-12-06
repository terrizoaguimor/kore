"use client"

import { Settings, User, Shield, Bell, Palette, Building } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your personal information",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Security",
    description: "Password and authentication settings",
    href: "/settings/security",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Configure notification preferences",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "Customize the look and feel",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    title: "Organization",
    description: "Manage your organization settings",
    href: "/settings/organization",
    icon: Building,
  },
]

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
