"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Copy,
  Link2,
  Mail,
  Lock,
  Globe,
  Trash2,
  Check,
  Loader2,
  Calendar,
  Users,
  Eye,
  Pencil,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import type { File as FileType } from "@/types/database"

interface Share {
  id: string
  token: string
  permission: "view" | "edit" | "upload"
  password_hash: string | null
  expires_at: string | null
  download_count: number
  max_downloads: number | null
  shared_with_email: string | null
  created_at: string
}

interface ShareDialogProps {
  file: FileType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shares, setShares] = useState<Share[]>([])
  const [copied, setCopied] = useState(false)

  // New share form state
  const [permission, setPermission] = useState<"view" | "edit" | "upload">("view")
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState("")
  const [useExpiry, setUseExpiry] = useState(false)
  const [expiryDays, setExpiryDays] = useState("7")
  const [useMaxDownloads, setUseMaxDownloads] = useState(false)
  const [maxDownloads, setMaxDownloads] = useState("10")
  const [shareEmail, setShareEmail] = useState("")

  // Load existing shares when dialog opens
  useEffect(() => {
    if (open && file) {
      fetchShares()
    }
  }, [open, file])

  const fetchShares = async () => {
    if (!file) return

    try {
      const response = await fetch(`/api/files/${file.id}/shares`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      console.error("Error fetching shares:", error)
    }
  }

  const createShare = async () => {
    if (!file) return

    setIsLoading(true)
    try {
      const body: Record<string, unknown> = {
        permission,
      }

      if (usePassword && password) {
        body.password = password
      }

      if (useExpiry) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays))
        body.expires_at = expiresAt.toISOString()
      }

      if (useMaxDownloads) {
        body.max_downloads = parseInt(maxDownloads)
      }

      if (shareEmail) {
        body.shared_with_email = shareEmail
      }

      const response = await fetch(`/api/files/${file.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to create share link")
      }

      const { share, url } = await response.json()
      setShares([share, ...shares])

      // Copy to clipboard
      await navigator.clipboard.writeText(url)
      toast.success("Share link created and copied to clipboard!")

      // Reset form
      setPassword("")
      setShareEmail("")
      setUsePassword(false)
      setUseExpiry(false)
      setUseMaxDownloads(false)
    } catch (error) {
      console.error("Error creating share:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create share link")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/files/${file?.id}/shares/${shareId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete share")
      }

      setShares(shares.filter(s => s.id !== shareId))
      toast.success("Share link deleted")
    } catch (error) {
      console.error("Error deleting share:", error)
      toast.error("Failed to delete share link")
    }
  }

  const copyShareLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case "view": return <Eye className="h-4 w-4" />
      case "edit": return <Pencil className="h-4 w-4" />
      case "upload": return <Upload className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b2d7c] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#0046E2]" />
            Share "{file.name}"
          </DialogTitle>
          <DialogDescription className="text-[#A1A1AA]">
            Create a shareable link or share with specific people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create New Share Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#0046E2]" />
              Create Share Link
            </h3>

            {/* Permission */}
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Permission</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit" | "upload")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243178] border-white/10">
                  <SelectItem value="view" className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" /> View only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit" className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" /> Can edit
                    </div>
                  </SelectItem>
                  {file.type === "folder" && (
                    <SelectItem value="upload" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Can upload
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Share with email (optional) */}
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Share with email (optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>

            {/* Password Protection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#A1A1AA]" />
                <Label className="text-[#A1A1AA]">Password protection</Label>
              </div>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>
            {usePassword && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white/5 border-white/10 text-white placeholder:text-[#A1A1AA]"
              />
            )}

            {/* Expiry */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#A1A1AA]" />
                <Label className="text-[#A1A1AA]">Set expiration</Label>
              </div>
              <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
            </div>
            {useExpiry && (
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243178] border-white/10">
                  <SelectItem value="1" className="text-white hover:bg-white/10">1 day</SelectItem>
                  <SelectItem value="7" className="text-white hover:bg-white/10">7 days</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-white/10">30 days</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-white/10">90 days</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Max Downloads */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#A1A1AA]" />
                <Label className="text-[#A1A1AA]">Limit downloads</Label>
              </div>
              <Switch checked={useMaxDownloads} onCheckedChange={setUseMaxDownloads} />
            </div>
            {useMaxDownloads && (
              <Input
                type="number"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                placeholder="Max downloads"
                min="1"
                className="bg-white/5 border-white/10 text-white placeholder:text-[#A1A1AA]"
              />
            )}

            <Button
              onClick={createShare}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] font-semibold hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Create Share Link
            </Button>
          </div>

          {/* Existing Shares */}
          {shares.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white border-t border-white/10 pt-4">
                Active Share Links ({shares.length})
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#0046E2]/10">
                        {getPermissionIcon(share.permission)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white capitalize">
                            {share.permission} access
                          </span>
                          {share.password_hash && (
                            <Lock className="h-3 w-3 text-[#A1A1AA]" />
                          )}
                        </div>
                        <p className="text-xs text-[#A1A1AA]">
                          {share.download_count} downloads
                          {share.max_downloads && ` / ${share.max_downloads} max`}
                          {share.expires_at && (
                            <> • Expires {new Date(share.expires_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyShareLink(share.token)}
                        className="h-8 w-8 text-[#A1A1AA] hover:text-white hover:bg-white/10"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShare(share.id)}
                        className="h-8 w-8 text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
