"use client"

import { useState, useEffect, use } from "react"
import {
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Download,
  Lock,
  AlertCircle,
  Clock,
  Loader2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface ShareData {
  id: string
  file: {
    id: string
    name: string
    type: "file" | "folder"
    mime_type: string | null
    size: number
  }
  permission: "view" | "edit" | "upload"
  requires_password: boolean
  expires_at: string | null
  download_count: number
  max_downloads: number | null
}

const getFileIcon = (mimeType: string | null, type: string) => {
  if (type === "folder") return Folder

  const mime = mimeType || ""
  if (mime.startsWith("image/")) return Image
  if (mime.startsWith("video/")) return Film
  if (mime.startsWith("audio/")) return Music
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text")) return FileText
  if (mime.includes("zip") || mime.includes("archive")) return Archive
  return File
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchShareInfo()
  }, [])

  const fetchShareInfo = async () => {
    try {
      const response = await fetch(`/api/share/${resolvedParams.token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Share not found")
        return
      }

      setShareData(data)

      if (!data.requires_password) {
        setIsAuthenticated(true)
      }
    } catch (err) {
      setError("Failed to load share")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPassword = async () => {
    if (!password) {
      toast.error("Please enter a password")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/share/${resolvedParams.token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        toast.error("Incorrect password")
        return
      }

      setIsAuthenticated(true)
      toast.success("Access granted")
    } catch (err) {
      toast.error("Failed to verify password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/share/${resolvedParams.token}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Download failed")
      }

      const data = await response.json()

      // Trigger download
      const link = document.createElement("a")
      link.href = data.url
      link.download = shareData?.file.name || "download"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Download started")

      // Update download count
      if (shareData) {
        setShareData({
          ...shareData,
          download_count: shareData.download_count + 1,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    } finally {
      setIsDownloading(false)
    }
  }

  const loadPreview = async () => {
    try {
      const response = await fetch(`/api/share/${resolvedParams.token}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || undefined }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewUrl(data.url)
      }
    } catch (err) {
      console.error("Preview error:", err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && shareData?.file.type === "file") {
      loadPreview()
    }
  }, [isAuthenticated, shareData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1a4a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0046E2]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1a4a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#243178] border-white/10">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Share Not Found</h2>
            <p className="text-[#A1A1AA]">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shareData) return null

  const Icon = getFileIcon(shareData.file.mime_type, shareData.file.type)
  const isExpired = shareData.expires_at && new Date(shareData.expires_at) < new Date()
  const downloadLimitReached = shareData.max_downloads && shareData.download_count >= shareData.max_downloads

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0f1a4a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#243178] border-white/10">
          <CardContent className="pt-6 text-center">
            <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
            <p className="text-[#A1A1AA]">This share link has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password screen
  if (shareData.requires_password && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1a4a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#243178] border-white/10">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-[#0046E2] mx-auto mb-2" />
            <CardTitle className="text-white">Password Required</CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              This file is password protected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="bg-white/5 border-white/10 text-white"
              onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
            />
            <Button
              onClick={verifyPassword}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] font-semibold"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main share view
  return (
    <div className="min-h-screen bg-[#0f1a4a] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-[#243178] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-[#0046E2]/10">
              <Icon className="h-10 w-10 text-[#0046E2]" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white truncate">{shareData.file.name}</CardTitle>
              <CardDescription className="text-[#A1A1AA]">
                {shareData.file.type === "folder" ? "Folder" : formatFileSize(shareData.file.size)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview for images/videos */}
          {previewUrl && shareData.file.mime_type?.startsWith("image/") && (
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={previewUrl}
                alt={shareData.file.name}
                className="w-full h-auto max-h-[400px] object-contain bg-black"
              />
            </div>
          )}

          {previewUrl && shareData.file.mime_type?.startsWith("video/") && (
            <div className="rounded-lg overflow-hidden border border-white/10">
              <video
                src={previewUrl}
                controls
                className="w-full h-auto max-h-[400px] bg-black"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex items-center justify-between text-sm text-[#A1A1AA] border-t border-white/10 pt-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {shareData.permission} access
            </span>
            {shareData.max_downloads && (
              <span>
                {shareData.download_count} / {shareData.max_downloads} downloads
              </span>
            )}
          </div>

          {/* Download button */}
          {shareData.file.type === "file" && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading || !!downloadLimitReached}
              className="w-full bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] font-semibold"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadLimitReached ? "Download limit reached" : "Download"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
