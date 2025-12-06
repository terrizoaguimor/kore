"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: "uploading" | "completed" | "error"
}

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  uploadProgress?: UploadProgress[]
  className?: string
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
}

export function FileUploader({
  onUpload,
  uploadProgress = [],
  className,
  maxSize = 52428800, // 50MB
  accept,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsDragging(false)
      if (acceptedFiles.length > 0) {
        await onUpload(acceptedFiles)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    noClick: true,
    maxSize,
    accept,
  })

  const hasActiveUploads = uploadProgress.some((p) => p.status === "uploading")

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          isDragActive || isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          "p-8 text-center"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "rounded-full p-4 transition-colors",
              isDragActive || isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragActive || isDragging
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click the button below to select files
            </p>
          </div>

          <Button onClick={open} disabled={hasActiveUploads}>
            {hasActiveUploads ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadProgress.map((item) => (
            <div
              key={item.fileId}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.fileName}</p>
                {item.status === "uploading" && (
                  <Progress value={item.progress} className="mt-1 h-1" />
                )}
              </div>
              <div className="flex-shrink-0">
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {item.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact uploader for toolbar
export function FileUploaderCompact({
  onUpload,
  disabled,
}: {
  onUpload: (files: File[]) => Promise<void>
  disabled?: boolean
}) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onUpload(acceptedFiles)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button onClick={open} disabled={disabled}>
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>
    </div>
  )
}
