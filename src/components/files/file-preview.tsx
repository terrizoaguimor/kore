"use client"

import { useState, useEffect } from "react"
import { X, Download, Share2, Star, Trash2, ExternalLink, FileText, Image as ImageIcon, Film, Music, Archive, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { File as FileType } from "@/types/database"
import { formatDistanceToNow } from "date-fns"

interface FilePreviewProps {
  file: FileType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (file: FileType) => void
  onDelete: (file: FileType) => void
  onToggleStar: (file: FileType) => void
  getPreviewUrl: (file: FileType) => Promise<string | null>
}

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return FileIcon
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.startsWith("video/")) return Film
  if (mimeType.startsWith("audio/")) return Music
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive
  return FileIcon
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function FilePreview({
  file,
  open,
  onOpenChange,
  onDownload,
  onDelete,
  onToggleStar,
  getPreviewUrl,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    if (file && open && file.type === "file") {
      setIsLoadingPreview(true)
      getPreviewUrl(file)
        .then(setPreviewUrl)
        .finally(() => setIsLoadingPreview(false))
    } else {
      setPreviewUrl(null)
    }
  }, [file, open, getPreviewUrl])

  if (!file) return null

  const Icon = getFileIcon(file.mime_type)
  const isImage = file.mime_type?.startsWith("image/")
  const isVideo = file.mime_type?.startsWith("video/")
  const isAudio = file.mime_type?.startsWith("audio/")
  const isPdf = file.mime_type === "application/pdf"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left text-lg break-all">
                  {file.name}
                </SheetTitle>
                {file.type === "file" && (
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {file.type === "file" && (
              <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStar(file)}
            >
              <Star
                className={`mr-2 h-4 w-4 ${file.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
              {file.is_starred ? "Starred" : "Star"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(file)
                onOpenChange(false)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Preview */}
        {file.type === "file" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Preview</h4>
            <div className="rounded-lg border bg-muted/50 p-4">
              {isLoadingPreview ? (
                <Skeleton className="h-48 w-full" />
              ) : previewUrl ? (
                <>
                  {isImage && (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="max-h-64 w-full rounded object-contain"
                    />
                  )}
                  {isVideo && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-64 w-full rounded"
                    />
                  )}
                  {isAudio && (
                    <audio src={previewUrl} controls className="w-full" />
                  )}
                  {isPdf && (
                    <div className="text-center">
                      <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        PDF Preview
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(previewUrl, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in new tab
                      </Button>
                    </div>
                  )}
                  {!isImage && !isVideo && !isAudio && !isPdf && (
                    <div className="text-center py-8">
                      <Icon className="mx-auto h-16 w-16 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Preview not available
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Icon className="mx-auto h-16 w-16 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Preview not available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Details</h4>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">
                {file.type === "folder" ? "Folder" : file.mime_type || "Unknown"}
              </dd>
            </div>
            {file.type === "file" && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{formatFileSize(file.size)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Modified</dt>
              <dd className="font-medium">
                {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium">{file.version}</dd>
            </div>
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  )
}
