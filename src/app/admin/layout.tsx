import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Building2,
  HardDrive,
  Activity,
  Settings,
  Shield,
  ArrowLeft
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const adminNavItems = [
  { href: "/admin", icon: Activity, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/organizations", icon: Building2, label: "Organizations" },
  { href: "/admin/storage", icon: HardDrive, label: "Storage" },
  { href: "/admin/logs", icon: Activity, label: "Activity Logs" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin/owner of any organization
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])

  if (!memberships || memberships.length === 0) {
    redirect("/files")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/files" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to App</span>
          </Link>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Admin Panel</span>
          </div>

          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
