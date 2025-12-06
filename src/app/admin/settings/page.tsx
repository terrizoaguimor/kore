"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  // General Settings
  const [appName, setAppName] = useState("CloudHub")
  const [defaultLanguage, setDefaultLanguage] = useState("en")
  const [defaultTimezone, setDefaultTimezone] = useState("UTC")

  // Storage Settings
  const [defaultStorageQuota, setDefaultStorageQuota] = useState("5")
  const [maxFileSize, setMaxFileSize] = useState("100")
  const [allowedFileTypes, setAllowedFileTypes] = useState("*")

  // Security Settings
  const [requireEmailVerification, setRequireEmailVerification] = useState(true)
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("24")
  const [require2FA, setRequire2FA] = useState(false)

  // Features
  const [enableChat, setEnableChat] = useState(true)
  const [enableVideoCalls, setEnableVideoCalls] = useState(true)
  const [enableTasks, setEnableTasks] = useState(true)
  const [enableNotes, setEnableNotes] = useState(true)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure global platform settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Basic platform configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTimezone">Default Timezone</Label>
              <Select value={defaultTimezone} onValueChange={setDefaultTimezone}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Storage Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>
              Configure storage limits and file handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultStorageQuota">Default Storage Quota (GB)</Label>
                <Input
                  id="defaultStorageQuota"
                  type="number"
                  value={defaultStorageQuota}
                  onChange={(e) => setDefaultStorageQuota(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={allowedFileTypes}
                onChange={(e) => setAllowedFileTypes(e.target.value)}
                placeholder="* for all, or comma-separated extensions"
              />
              <p className="text-xs text-muted-foreground">
                Use * to allow all types, or specify extensions like: .pdf, .doc, .jpg
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Authentication and security options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify their email before accessing the platform
                </p>
              </div>
              <Switch
                checked={requireEmailVerification}
                onCheckedChange={setRequireEmailVerification}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Public Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can create an account without an invitation
                </p>
              </div>
              <Switch
                checked={allowPublicRegistration}
                onCheckedChange={setAllowPublicRegistration}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  All users must enable 2FA for their accounts
                </p>
              </div>
              <Switch
                checked={require2FA}
                onCheckedChange={setRequire2FA}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Enable or disable platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Chat / Talk</Label>
                <p className="text-sm text-muted-foreground">
                  Enable messaging between users
                </p>
              </div>
              <Switch checked={enableChat} onCheckedChange={setEnableChat} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Video Calls</Label>
                <p className="text-sm text-muted-foreground">
                  Enable video and audio calls
                </p>
              </div>
              <Switch
                checked={enableVideoCalls}
                onCheckedChange={setEnableVideoCalls}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tasks</Label>
                <p className="text-sm text-muted-foreground">
                  Enable Kanban boards and task management
                </p>
              </div>
              <Switch checked={enableTasks} onCheckedChange={setEnableTasks} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground">
                  Enable notes with markdown support
                </p>
              </div>
              <Switch checked={enableNotes} onCheckedChange={setEnableNotes} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
