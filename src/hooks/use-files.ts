"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import type { File as FileType } from "@/types/database"
import { toast } from "sonner"

interface UseFilesOptions {
  parentId?: string | null
}

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: "uploading" | "completed" | "error"
}

// Helper to get untyped supabase client for database operations
// This is necessary until we generate proper Supabase types from our schema
const getDb = (supabase: ReturnType<typeof createClient>) => {
  return supabase as any
}

export function useFiles(options: UseFilesOptions = {}) {
  const { parentId = null } = options
  const { organization } = useAuthStore()
  const [files, setFiles] = useState<FileType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  const supabase = createClient()
  const db = getDb(supabase)

  const fetchFiles = useCallback(async () => {
    if (!organization) return

    setIsLoading(true)
    try {
      let query = db
        .from("files")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_trashed", false)
        .order("type", { ascending: true })
        .order("name", { ascending: true })

      if (parentId) {
        query = query.eq("parent_id", parentId)
      } else {
        query = query.is("parent_id", null)
      }

      const { data, error } = await query

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Failed to load files")
    } finally {
      setIsLoading(false)
    }
  }, [organization, parentId, db])

  const createFolder = useCallback(async (name: string) => {
    if (!organization) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await db
        .from("files")
        .insert({
          organization_id: organization.id,
          parent_id: parentId,
          owner_id: user.id,
          name,
          type: "folder",
        })
        .select()
        .single()

      if (error) throw error

      setFiles((prev) => [...prev, data])
      toast.success(`Folder "${name}" created`)
      return data
    } catch (error: any) {
      console.error("Error creating folder:", error)
      if (error.code === "23505") {
        toast.error("A folder with this name already exists")
      } else {
        toast.error("Failed to create folder")
      }
      return null
    }
  }, [organization, parentId, supabase, db])

  const uploadFile = useCallback(async (file: File) => {
    if (!organization) return null

    const tempId = crypto.randomUUID()
    setUploadProgress((prev) => [...prev, {
      fileId: tempId,
      fileName: file.name,
      progress: 0,
      status: "uploading"
    }])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate storage path
      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const storagePath = `${organization.id}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress((prev) =>
        prev.map((p) => p.fileId === tempId ? { ...p, progress: 50 } : p)
      )

      // Create file record
      const { data, error: dbError } = await db
        .from("files")
        .insert({
          organization_id: organization.id,
          parent_id: parentId,
          owner_id: user.id,
          name: file.name,
          type: "file",
          mime_type: file.type,
          size: file.size,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadProgress((prev) =>
        prev.map((p) => p.fileId === tempId ? { ...p, progress: 100, status: "completed" } : p)
      )

      // Update storage used
      await db.rpc("update_storage_used", {
        org_id: organization.id,
        size_change: file.size,
      }).catch(() => {}) // Ignore if function doesn't exist

      setFiles((prev) => [...prev, data])

      setTimeout(() => {
        setUploadProgress((prev) => prev.filter((p) => p.fileId !== tempId))
      }, 2000)

      return data
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadProgress((prev) =>
        prev.map((p) => p.fileId === tempId ? { ...p, status: "error" } : p)
      )
      toast.error(`Failed to upload ${file.name}`)
      return null
    }
  }, [organization, parentId, supabase, db])

  const uploadFiles = useCallback(async (fileList: File[]) => {
    const results = await Promise.all(fileList.map(uploadFile))
    const successCount = results.filter(Boolean).length
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`)
    }
    return results
  }, [uploadFile])

  const deleteFile = useCallback(async (file: FileType) => {
    try {
      if (file.type === "file" && file.storage_path) {
        await supabase.storage.from("files").remove([file.storage_path])
      }

      const { error } = await db
        .from("files")
        .update({ is_trashed: true, trashed_at: new Date().toISOString() })
        .eq("id", file.id)

      if (error) throw error

      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success(`"${file.name}" moved to trash`)
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    }
  }, [supabase, db])

  const renameFile = useCallback(async (file: FileType, newName: string) => {
    try {
      const { data, error } = await db
        .from("files")
        .update({ name: newName })
        .eq("id", file.id)
        .select()
        .single()

      if (error) throw error

      setFiles((prev) => prev.map((f) => f.id === file.id ? data : f))
      toast.success(`Renamed to "${newName}"`)
      return data
    } catch (error: any) {
      console.error("Error renaming file:", error)
      if (error.code === "23505") {
        toast.error("A file with this name already exists")
      } else {
        toast.error("Failed to rename file")
      }
      return null
    }
  }, [db])

  const moveFile = useCallback(async (file: FileType, newParentId: string | null) => {
    try {
      const { data, error } = await db
        .from("files")
        .update({ parent_id: newParentId })
        .eq("id", file.id)
        .select()
        .single()

      if (error) throw error

      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success(`"${file.name}" moved`)
      return data
    } catch (error) {
      console.error("Error moving file:", error)
      toast.error("Failed to move file")
      return null
    }
  }, [db])

  const toggleStar = useCallback(async (file: FileType) => {
    try {
      const { data, error } = await db
        .from("files")
        .update({ is_starred: !file.is_starred })
        .eq("id", file.id)
        .select()
        .single()

      if (error) throw error

      setFiles((prev) => prev.map((f) => f.id === file.id ? data : f))
      toast.success(data.is_starred ? "Added to favorites" : "Removed from favorites")
      return data
    } catch (error) {
      console.error("Error toggling star:", error)
      toast.error("Failed to update favorite status")
      return null
    }
  }, [db])

  const getDownloadUrl = useCallback(async (file: FileType) => {
    if (!file.storage_path) return null

    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(file.storage_path, 3600) // 1 hour

    if (error) {
      console.error("Error getting download URL:", error)
      return null
    }

    return data.signedUrl
  }, [supabase])

  const downloadFile = useCallback(async (file: FileType) => {
    const url = await getDownloadUrl(file)
    if (!url) {
      toast.error("Failed to download file")
      return
    }

    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [getDownloadUrl])

  return {
    files,
    isLoading,
    uploadProgress,
    fetchFiles,
    createFolder,
    uploadFile,
    uploadFiles,
    deleteFile,
    renameFile,
    moveFile,
    toggleStar,
    getDownloadUrl,
    downloadFile,
  }
}
