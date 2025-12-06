"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Bell, Mail, MessageSquare, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  desktop_notifications: boolean
  chat_notifications: boolean
  calendar_reminders: boolean
  file_updates: boolean
  task_reminders: boolean
  marketing_emails: boolean
}

const defaultSettings: NotificationSettings = {
  email_notifications: true,
  push_notifications: true,
  desktop_notifications: true,
  chat_notifications: true,
  calendar_reminders: true,
  file_updates: true,
  task_reminders: true,
  marketing_emails: false,
}

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)

  const supabase = createClient()
  const db = supabase as any

  useEffect(() => {
    if (user?.settings) {
      const userSettings = user.settings as any
      setSettings({
        ...defaultSettings,
        ...userSettings.notifications,
      })
    }
  }, [user])

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await db
        .from("users")
        .update({
          settings: {
            ...(user.settings as object || {}),
            notifications: settings,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Update local user state
      if (user) {
        setUser({
          ...user,
          settings: {
            ...(user.settings as object || {}),
            notifications: settings,
          } as any,
        })
      }
      toast.success("Notification settings saved")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b bg-background px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* General Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>General Notifications</CardTitle>
              </div>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(v) => updateSetting("email_notifications", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on mobile
                  </p>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={(v) => updateSetting("push_notifications", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Desktop Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Show notifications on your desktop
                  </p>
                </div>
                <Switch
                  checked={settings.desktop_notifications}
                  onCheckedChange={(v) => updateSetting("desktop_notifications", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* App-Specific Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>App Notifications</CardTitle>
              <CardDescription>Choose which apps can send you notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">Chat Messages</p>
                    <p className="text-sm text-muted-foreground">New messages in Talk</p>
                  </div>
                </div>
                <Switch
                  checked={settings.chat_notifications}
                  onCheckedChange={(v) => updateSetting("chat_notifications", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">Calendar Reminders</p>
                    <p className="text-sm text-muted-foreground">Upcoming events and meetings</p>
                  </div>
                </div>
                <Switch
                  checked={settings.calendar_reminders}
                  onCheckedChange={(v) => updateSetting("calendar_reminders", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">File Updates</p>
                    <p className="text-sm text-muted-foreground">File shares and comments</p>
                  </div>
                </div>
                <Switch
                  checked={settings.file_updates}
                  onCheckedChange={(v) => updateSetting("file_updates", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">Task Reminders</p>
                    <p className="text-sm text-muted-foreground">Due dates and assignments</p>
                  </div>
                </div>
                <Switch
                  checked={settings.task_reminders}
                  onCheckedChange={(v) => updateSetting("task_reminders", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Marketing</CardTitle>
              </div>
              <CardDescription>Control marketing communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Product updates, tips, and promotions
                  </p>
                </div>
                <Switch
                  checked={settings.marketing_emails}
                  onCheckedChange={(v) => updateSetting("marketing_emails", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
