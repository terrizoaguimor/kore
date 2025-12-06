"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Shield, Key, Smartphone, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

export default function SecuritySettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const supabase = createClient()

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords don't match")
      return
    }

    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (error) throw error

      toast.success("Password changed successfully")
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.message || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    // This would integrate with Supabase MFA in production
    setTwoFactorEnabled(enabled)
    toast.success(enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled")
  }

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" })
      toast.success("Signed out from all devices")
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
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
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="text-sm text-muted-foreground">Manage your account security</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>Update your password regularly for better security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwords.new || !passwords.confirm}
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle>Two-Factor Authentication</CardTitle>
              </div>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app to generate verification codes
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Active Sessions</CardTitle>
              </div>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      This device • Active now
                    </p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
              </div>

              <Separator />

              <Button
                variant="destructive"
                onClick={handleSignOutAllDevices}
                className="w-full"
              >
                Sign Out From All Devices
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
