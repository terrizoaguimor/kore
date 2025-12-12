"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Upload,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  MoreHorizontal,
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Star,
  Trash2,
  Download,
  Share2,
  Info,
  Pencil,
  ChevronRight,
  Home,
  FolderOpen,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { useFiles } from "@/hooks/use-files"
import { useAuthStore } from "@/stores/auth-store"
import { FileUploaderCompact } from "@/components/files/file-uploader"
import { NewFolderDialog } from "@/components/files/new-folder-dialog"
import { RenameDialog } from "@/components/files/rename-dialog"
import { FilePreview } from "@/components/files/file-preview"
import { ShareDialog } from "@/components/files/share-dialog"
import type { File as FileType } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  if (item.type === "folder") return "text-[#0046E2]"

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

interface BreadcrumbPath {
  id: string | null
  name: string
}

export default function FilesPage() {
  const router = useRouter()
  const { organization } = useAuthStore()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbPath[]>([{ id: null, name: "Files" }])
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameFile, setRenameFile] = useState<FileType | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareFile, setShareFile] = useState<FileType | null>(null)

  const {
    files,
    isLoading,
    uploadProgress,
    fetchFiles,
    createFolder,
    uploadFiles,
    deleteFile,
    renameFile: handleRename,
    toggleStar,
    getDownloadUrl,
    downloadFile,
  } = useFiles({ parentId: currentFolderId })

  useEffect(() => {
    if (organization) {
      fetchFiles()
    }
  }, [organization, fetchFiles])

  const handleFolderClick = useCallback(async (folder: FileType) => {
    setCurrentFolderId(folder.id)
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }, [])

  const handleBreadcrumbClick = useCallback((index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id)
  }, [breadcrumbs])

  const handleFileClick = useCallback((file: FileType) => {
    if (file.type === "folder") {
      handleFolderClick(file)
    } else {
      setSelectedFile(file)
      setPreviewOpen(true)
    }
  }, [handleFolderClick])

  const handleUpload = useCallback(async (fileList: File[]) => {
    await uploadFiles(fileList)
  }, [uploadFiles])

  const openRenameDialog = useCallback((file: FileType) => {
    setRenameFile(file)
    setRenameOpen(true)
  }, [])

  const openShareDialog = useCallback((file: FileType) => {
    setShareFile(file)
    setShareOpen(true)
  }, [])

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0f1a4a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0046E2]" />
          <p className="mt-2 text-[#A1A1AA]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0f1a4a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#243178] bg-[#0f1a4a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.id || "root"}>
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <BreadcrumbLink
                        className="cursor-pointer text-[#A1A1AA] hover:text-[#0046E2] transition-colors"
                        onClick={() => handleBreadcrumbClick(index)}
                      >
                        {index === 0 ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          crumb.name
                        )}
                      </BreadcrumbLink>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4 text-[#A1A1AA]" />
                      </BreadcrumbSeparator>
                    </>
                  ) : (
                    <BreadcrumbPage className="font-medium text-white">
                      {index === 0 ? "All Files" : crumb.name}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <FileUploaderCompact
            onUpload={handleUpload}
            disabled={uploadProgress.some((p) => p.status === "uploading")}
          />
          <NewFolderDialog onCreateFolder={createFolder} />
          <Separator orientation="vertical" className="mx-2 h-6 bg-[#243178]" />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-[#A1A1AA] hover:text-white hover:bg-[#243178]",
              viewMode === "grid" && "bg-[#243178] text-[#0046E2]"
            )}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-[#A1A1AA] hover:text-white hover:bg-[#243178]",
              viewMode === "list" && "bg-[#243178] text-[#0046E2]"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-lg border border-[#243178] bg-[#243178] p-4">
                <Skeleton className="aspect-square w-full rounded-lg bg-[#2d3c8a]" />
                <Skeleton className="mt-3 h-4 w-3/4 bg-[#2d3c8a]" />
                <Skeleton className="mt-1 h-3 w-1/2 bg-[#2d3c8a]" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-[#A1A1AA]" />
            <h3 className="mt-4 text-lg font-medium text-white">No files yet</h3>
            <p className="mt-2 text-[#A1A1AA]">
              Upload files or create a folder to get started
            </p>
            <div className="mt-6 flex gap-2">
              <FileUploaderCompact onUpload={handleUpload} />
              <NewFolderDialog onCreateFolder={createFolder} />
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {files.map((item) => {
              const Icon = getFileIcon(item)
              const iconColor = getIconColor(item)

              return (
                <div
                  key={item.id}
                  className="group cursor-pointer rounded-lg border border-[#243178] bg-[#243178] p-4 transition-all hover:border-[#0046E2]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
                  onClick={() => handleFileClick(item)}
                >
                  <div className="relative mb-3 flex aspect-square items-center justify-center rounded-lg bg-[#0f1a4a]">
                    <Icon className={`h-12 w-12 ${iconColor}`} />
                    {item.is_starred && (
                      <Star className="absolute left-2 top-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-8 w-8 opacity-0 group-hover:opacity-100 text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#243178] border-[#2d3c8a]" onClick={(e) => e.stopPropagation()}>
                        {item.type === "file" && (
                          <DropdownMenuItem onClick={() => downloadFile(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openShareDialog(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameDialog(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStar(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Star className={`mr-2 h-4 w-4 ${item.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          {item.is_starred ? "Remove star" : "Add star"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedFile(item)
                          setPreviewOpen(true)
                        }} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Info className="mr-2 h-4 w-4" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2d3c8a]" />
                        <DropdownMenuItem
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                          onClick={() => deleteFile(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1">
                    <p className="truncate text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-[#A1A1AA]">
                      {item.type === "folder" ? "Folder" : formatFileSize(item.size)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[#243178] bg-[#243178]">
            <div className="grid grid-cols-12 gap-4 border-b border-[#2d3c8a] px-4 py-3 text-sm font-medium text-[#A1A1AA]">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Modified</div>
              <div className="col-span-1"></div>
            </div>
            {files.map((item) => {
              const Icon = getFileIcon(item)
              const iconColor = getIconColor(item)

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 border-b border-[#2d3c8a] px-4 py-3 last:border-0 hover:bg-[#2d3c8a]/50 cursor-pointer items-center transition-colors"
                  onClick={() => handleFileClick(item)}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    {item.is_starred && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
                    <span className="truncate text-white">{item.name}</span>
                  </div>
                  <div className="col-span-2 text-sm text-[#A1A1AA]">
                    {item.type === "folder" ? "-" : formatFileSize(item.size)}
                  </div>
                  <div className="col-span-3 text-sm text-[#A1A1AA]">
                    {formatDate(item.updated_at)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#243178] border-[#2d3c8a]" onClick={(e) => e.stopPropagation()}>
                        {item.type === "file" && (
                          <DropdownMenuItem onClick={() => downloadFile(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openShareDialog(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameDialog(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStar(item)} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Star className={`mr-2 h-4 w-4 ${item.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          {item.is_starred ? "Remove star" : "Add star"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedFile(item)
                          setPreviewOpen(true)
                        }} className="text-[#A1A1AA] hover:text-white hover:bg-[#2d3c8a] focus:bg-[#2d3c8a]">
                          <Info className="mr-2 h-4 w-4" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2d3c8a]" />
                        <DropdownMenuItem
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                          onClick={() => deleteFile(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* File Preview Sheet */}
      <FilePreview
        file={selectedFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={downloadFile}
        onDelete={deleteFile}
        onToggleStar={toggleStar}
        getPreviewUrl={getDownloadUrl}
      />

      {/* Rename Dialog */}
      <RenameDialog
        file={renameFile}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onRename={handleRename}
      />

      {/* Share Dialog */}
      <ShareDialog
        file={shareFile}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  )
}
