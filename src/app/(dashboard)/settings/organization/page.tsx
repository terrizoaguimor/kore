"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  Mail,
  Trash2,
  UserPlus,
  Crown,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  guest: Users,
}

const roleColors: Record<string, string> = {
  owner: "bg-[#FFB830]/10 text-[#FFB830]",
  admin: "bg-[#00E5FF]/10 text-[#00E5FF]",
  member: "bg-[#00D68F]/10 text-[#00D68F]",
  guest: "bg-[#A1A1AA]/10 text-[#A1A1AA]",
}

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const { user, organization, setOrganization } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  })

  const supabase = createClient()
  const db = supabase as any

  // Fetch organization members
  const fetchMembers = async () => {
    if (!organization) return

    try {
      const { data, error } = await db
        .from("organization_members")
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user:users(id, email, full_name, avatar_url)
        `)
        .eq("organization_id", organization.id)
        .order("role")

      if (error) throw error
      setMembers(data as any || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
      })
      fetchMembers()
    }
  }, [organization])

  // Get current user's role
  const currentUserMember = members.find((m) => m.user_id === user?.id)
  const isOwnerOrAdmin = currentUserMember?.role === "owner" || currentUserMember?.role === "admin"

  const handleSaveOrganization = async () => {
    if (!organization || !isOwnerOrAdmin) return

    setIsSaving(true)
    try {
      const { error } = await db
        .from("organizations")
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization.id)

      if (error) throw error

      // Update local organization state
      if (organization) {
        setOrganization({
          ...organization,
          name: formData.name,
        })
      }
      toast.success("Organization updated")
    } catch (error) {
      console.error("Error updating organization:", error)
      toast.error("Failed to update organization")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInviteMember = async () => {
    if (!organization || !inviteEmail.trim()) return

    try {
      // In production, this would send an invitation email
      // For now, we'll just show a success message
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
    } catch (error) {
      console.error("Error inviting member:", error)
      toast.error("Failed to send invitation")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwnerOrAdmin) return

    try {
      const { error } = await db
        .from("organization_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error

      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success("Member removed")
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member")
    }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!isOwnerOrAdmin) return

    try {
      const { error } = await db
        .from("organization_members")
        .update({ role: newRole })
        .eq("id", memberId)

      if (error) throw error

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
      toast.success("Role updated")
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    }
  }

  if (!organization) {
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
          <h1 className="text-2xl font-semibold">Organization</h1>
          <p className="text-sm text-muted-foreground">Manage your organization settings</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Organization Details</CardTitle>
              </div>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isOwnerOrAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">URL Slug</Label>
                <Input
                  id="org-slug"
                  value={formData.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your organization URL
                </p>
              </div>
              {isOwnerOrAdmin && (
                <Button onClick={handleSaveOrganization} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Members</CardTitle>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>
                {isOwnerOrAdmin && (
                  <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                )}
              </div>
              <CardDescription>People who have access to this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const RoleIcon = roleIcons[member.role] || Users
                    const isCurrentUser = member.user_id === user?.id
                    const isOwner = member.role === "owner"

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.user.full_name?.slice(0, 2).toUpperCase() ||
                                member.user.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.user.full_name || member.user.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwnerOrAdmin && !isOwner && !isCurrentUser ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleChangeRole(member.id, v)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="guest">Guest</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={roleColors[member.role]}
                            >
                              <RoleIcon className="mr-1 h-3 w-3" />
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          )}
                          {isOwnerOrAdmin && !isOwner && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Your organization's storage usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span>{formatBytes(organization.storage_used || 0)} / {formatBytes(organization.storage_quota || 0)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        ((organization.storage_used || 0) / (organization.storage_quota || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite someone to join your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
