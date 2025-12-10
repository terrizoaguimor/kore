"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Trash2,
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { File as FileType } from "@/types/database"

const getFileIcon = (item: FileType) => {
  if (item.type === "folder") return Folder

  const mime = item.mime_type || ""
  if (mime.startsWith("image/")) return Image
  if (mime.startsWith("video/")) return Film
  if (mime.startsWith("audio/")) return Music
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text")) return FileText
  if (mime.includes("zip") || mime.includes("archive")) return Archive
  return File
}

const getIconColor = (item: FileType) => {
  if (item.type === "folder") return "text-[#00E5FF]"

  const mime = item.mime_type || ""
  if (mime.startsWith("image/")) return "text-green-400"
  if (mime.startsWith("video/")) return "text-purple-400"
  if (mime.startsWith("audio/")) return "text-pink-400"
  if (mime.includes("pdf")) return "text-red-400"
  return "text-[#A1A1AA]"
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export default function TrashPage() {
  const { organization } = useAuthStore()
  const [trashedFiles, setTrashedFiles] = useState<FileType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isEmptying, setIsEmptying] = useState(false)

  const supabase = createClient()

  const fetchTrashedFiles = useCallback(async () => {
    if (!organization) return

    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("files")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_trashed", true)
        .order("trashed_at", { ascending: false })

      if (error) throw error
      setTrashedFiles(data || [])
    } catch (error) {
      console.error("Error fetching trashed files:", error)
      toast.error("Failed to load trash")
    } finally {
      setIsLoading(false)
    }
  }, [organization, supabase])

  useEffect(() => {
    if (organization) {
      fetchTrashedFiles()
    }
  }, [organization, fetchTrashedFiles])

  const restoreFile = async (file: FileType) => {
    setIsRestoring(file.id)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("files")
        .update({ is_trashed: false, trashed_at: null })
        .eq("id", file.id)

      if (error) throw error

      setTrashedFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success(`"${file.name}" restored`)
    } catch (error) {
      console.error("Error restoring file:", error)
      toast.error("Failed to restore file")
    } finally {
      setIsRestoring(null)
    }
  }

  const permanentlyDelete = async (file: FileType) => {
    setIsDeleting(file.id)
    try {
      // Delete from storage if it's a file
      if (file.type === "file" && file.storage_path) {
        await supabase.storage.from("files").remove([file.storage_path])
      }

      // Delete from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("files")
        .delete()
        .eq("id", file.id)

      if (error) throw error

      setTrashedFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success(`"${file.name}" permanently deleted`)
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    } finally {
      setIsDeleting(null)
    }
  }

  const emptyTrash = async () => {
    setIsEmptying(true)
    try {
      // Delete all files from storage
      const fileStoragePaths = trashedFiles
        .filter((f) => f.type === "file" && f.storage_path)
        .map((f) => f.storage_path!)

      if (fileStoragePaths.length > 0) {
        await supabase.storage.from("files").remove(fileStoragePaths)
      }

      // Delete all from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("files")
        .delete()
        .eq("organization_id", organization?.id)
        .eq("is_trashed", true)

      if (error) throw error

      setTrashedFiles([])
      toast.success("Trash emptied")
    } catch (error) {
      console.error("Error emptying trash:", error)
      toast.error("Failed to empty trash")
    } finally {
      setIsEmptying(false)
    }
  }

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0B0B0B]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0B0B0B]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1F1F1F] px-6 py-4">
        <div className="flex items-center gap-3">
          <Trash2 className="h-6 w-6 text-[#A1A1AA]" />
          <h1 className="text-xl font-semibold text-white">Trash</h1>
          <span className="text-sm text-[#A1A1AA]">
            {trashedFiles.length} item{trashedFiles.length !== 1 ? "s" : ""}
          </span>
        </div>

        {trashedFiles.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Empty Trash?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#A1A1AA]">
                  This will permanently delete all {trashedFiles.length} items in the trash.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={emptyTrash}
                  disabled={isEmptying}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  {isEmptying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          </div>
        ) : trashedFiles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Trash2 className="h-16 w-16 text-[#A1A1AA]" />
            <h3 className="mt-4 text-lg font-medium text-white">Trash is empty</h3>
            <p className="mt-2 text-[#A1A1AA]">
              Deleted files will appear here
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[#1F1F1F] bg-[#1F1F1F]">
            <div className="grid grid-cols-12 gap-4 border-b border-[#2A2A2A] px-4 py-3 text-sm font-medium text-[#A1A1AA]">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Deleted</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {trashedFiles.map((item) => {
              const Icon = getFileIcon(item)
              const iconColor = getIconColor(item)

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 border-b border-[#2A2A2A] px-4 py-3 last:border-0 hover:bg-[#2A2A2A]/50 items-center transition-colors"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
                    <span className="truncate text-white">{item.name}</span>
                  </div>
                  <div className="col-span-2 text-sm text-[#A1A1AA]">
                    {item.type === "folder" ? "-" : formatFileSize(item.size)}
                  </div>
                  <div className="col-span-3 text-sm text-[#A1A1AA] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.trashed_at
                      ? formatDistanceToNow(new Date(item.trashed_at), { addSuffix: true })
                      : "Unknown"}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreFile(item)}
                      disabled={isRestoring === item.id}
                      className="text-[#00E5FF] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10"
                    >
                      {isRestoring === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      <span className="ml-1">Restore</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting === item.id}
                          className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {isDeleting === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Delete permanently?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-[#A1A1AA]">
                            This will permanently delete "{item.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => permanentlyDelete(item)}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
