import { createClient } from "@/lib/supabase/server"
import {
  Users,
  Building2,
  HardDrive,
  FileText,
  Calendar,
  MessageSquare,
  CheckSquare,
  StickyNote,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"

async function getStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const [
    { count: usersCount },
    { count: orgsCount },
    { count: filesCount },
    { count: eventsCount },
    { count: contactsCount },
    { count: messagesCount },
    { count: tasksCount },
    { count: notesCount },
    { data: storageData },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("files").select("*", { count: "exact", head: true }).eq("type", "file"),
    supabase.from("calendar_events").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("storage_used, storage_quota"),
  ])

  const totalStorage = storageData?.reduce((acc: number, org: { storage_used?: number }) => acc + (org.storage_used || 0), 0) || 0
  const totalQuota = storageData?.reduce((acc: number, org: { storage_quota?: number }) => acc + (org.storage_quota || 0), 0) || 0

  return {
    users: usersCount || 0,
    organizations: orgsCount || 0,
    files: filesCount || 0,
    events: eventsCount || 0,
    contacts: contactsCount || 0,
    messages: messagesCount || 0,
    tasks: tasksCount || 0,
    notes: notesCount || 0,
    storage: {
      used: totalStorage,
      quota: totalQuota,
    },
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  const statCards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Organizations",
      value: stats.organizations,
      icon: Building2,
      description: "Active organizations",
    },
    {
      title: "Files",
      value: stats.files,
      icon: FileText,
      description: "Uploaded files",
    },
    {
      title: "Storage Used",
      value: formatBytes(stats.storage.used),
      icon: HardDrive,
      description: `of ${formatBytes(stats.storage.quota)} total`,
      isString: true,
    },
    {
      title: "Calendar Events",
      value: stats.events,
      icon: Calendar,
      description: "Scheduled events",
    },
    {
      title: "Contacts",
      value: stats.contacts,
      icon: Users,
      description: "Saved contacts",
    },
    {
      title: "Messages",
      value: stats.messages,
      icon: MessageSquare,
      description: "Chat messages",
    },
    {
      title: "Tasks",
      value: stats.tasks,
      icon: CheckSquare,
      description: "Created tasks",
    },
    {
      title: "Notes",
      value: stats.notes,
      icon: StickyNote,
      description: "Written notes",
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your CloudHub instance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isString ? stat.value : stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage Progress */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            Total storage usage across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{formatBytes(stats.storage.used)} used</span>
              <span>{formatBytes(stats.storage.quota)} total</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    (stats.storage.used / stats.storage.quota) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.storage.used / stats.storage.quota) * 100).toFixed(1)}% of total storage used
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
