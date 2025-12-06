"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Share2,
  MoreHorizontal,
  Star,
  Trash2,
  FileText,
  Table2,
  Presentation,
  Loader2,
  Check,
  Users,
  Download,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DocumentEditor } from "@/components/office/document-editor"
import { SpreadsheetEditor } from "@/components/office/spreadsheet-editor"
import { PresentationEditor } from "@/components/office/presentation-editor"

type DocumentType = "document" | "spreadsheet" | "presentation"

interface Document {
  id: string
  organization_id: string
  owner_id: string
  name: string
  type: DocumentType
  content: string | null
  is_starred: boolean
  last_edited_by: string | null
  created_at: string
  updated_at: string
}

const documentTypeConfig = {
  document: { icon: FileText, color: "#4285f4", label: "Document" },
  spreadsheet: { icon: Table2, color: "#34a853", label: "Spreadsheet" },
  presentation: { icon: Presentation, color: "#ea4335", label: "Presentation" },
}

export default function DocumentEditorPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.documentId as string
  const { user } = useAuthStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const db = supabase as any

  // Fetch document
  const fetchDocument = useCallback(async () => {
    if (!documentId) return

    try {
      const { data, error } = await db
        .from("office_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (error) throw error

      setDocument(data as Document)
      setName((data as Document).name)
      setContent((data as Document).content || "")
    } catch (error) {
      console.error("Error fetching document:", error)
      toast.error("Document not found")
      router.push("/office")
    } finally {
      setIsLoading(false)
    }
  }, [documentId, db, router])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  // Save document
  const saveDocument = useCallback(async (newContent?: string, newName?: string) => {
    if (!document || !user) return

    setIsSaving(true)
    try {
      const updates: Partial<Document> = {
        updated_at: new Date().toISOString(),
        last_edited_by: user.id,
      }

      if (newContent !== undefined) {
        updates.content = newContent
      }
      if (newName !== undefined) {
        updates.name = newName
      }

      const { error } = await db
        .from("office_documents")
        .update(updates)
        .eq("id", document.id)

      if (error) throw error

      setLastSaved(new Date())
      setHasChanges(false)

      if (newName !== undefined) {
        setDocument((prev) => prev ? { ...prev, name: newName } : null)
      }
    } catch (error) {
      console.error("Error saving document:", error)
      toast.error("Failed to save document")
    } finally {
      setIsSaving(false)
    }
  }, [document, user, db])

  // Debounced auto-save
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setHasChanges(true)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent)
    }, 2000)
  }, [saveDocument])

  // Handle name change
  const handleNameChange = useCallback((newName: string) => {
    setName(newName)
    setHasChanges(true)
  }, [])

  const handleNameBlur = useCallback(() => {
    if (name !== document?.name) {
      saveDocument(undefined, name)
    }
  }, [name, document, saveDocument])

  // Manual save
  const handleManualSave = useCallback(() => {
    saveDocument(content, name)
  }, [content, name, saveDocument])

  // Toggle star
  const handleToggleStar = async () => {
    if (!document) return

    try {
      const { error } = await db
        .from("office_documents")
        .update({ is_starred: !document.is_starred })
        .eq("id", document.id)

      if (error) throw error

      setDocument((prev) =>
        prev ? { ...prev, is_starred: !prev.is_starred } : null
      )
      toast.success(document.is_starred ? "Removed from starred" : "Added to starred")
    } catch (error) {
      console.error("Error updating document:", error)
      toast.error("Failed to update document")
    }
  }

  // Delete document
  const handleDelete = async () => {
    if (!document) return

    try {
      const { error } = await db
        .from("office_documents")
        .delete()
        .eq("id", document.id)

      if (error) throw error

      toast.success("Document deleted")
      router.push("/office")
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("Failed to delete document")
    }
  }

  // Export document
  const handleExport = useCallback(() => {
    if (!document) return

    let blob: Blob
    let filename: string

    if (document.type === "document") {
      blob = new Blob([content], { type: "text/html" })
      filename = `${document.name}.html`
    } else {
      blob = new Blob([content], { type: "application/json" })
      filename = `${document.name}.json`
    }

    const url = URL.createObjectURL(blob)
    const a = globalThis.document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Document exported")
  }, [document, content])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleManualSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleManualSave])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    )
  }

  const config = documentTypeConfig[document.type]
  const Icon = config.icon

  // Parse content for different document types
  const getInitialContent = () => {
    if (document.type === "spreadsheet") {
      try {
        return JSON.parse(content || '{"cells":{},"colWidths":{},"rowHeights":{}}')
      } catch {
        return { cells: {}, colWidths: {}, rowHeights: {} }
      }
    }
    if (document.type === "presentation") {
      try {
        return JSON.parse(content || '{"slides":[{"id":"1","backgroundColor":"#ffffff","elements":[]}]}')
      } catch {
        return { slides: [{ id: "1", backgroundColor: "#ffffff", elements: [] }] }
      }
    }
    return content
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/office")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: config.color }} />
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              className="border-0 bg-transparent text-lg font-medium focus-visible:ring-0 w-auto min-w-[200px]"
            />
          </div>

          {/* Save status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : hasChanges ? (
              <span>Unsaved changes</span>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStar}>
                <Star className={cn("mr-2 h-4 w-4", document.is_starred && "fill-yellow-400 text-yellow-400")} />
                {document.is_starred ? "Remove star" : "Add star"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden p-4">
        {document.type === "document" && (
          <div className="mx-auto max-w-4xl h-full">
            <DocumentEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing your document..."
              className="h-full"
            />
          </div>
        )}

        {document.type === "spreadsheet" && (
          <SpreadsheetEditor
            data={getInitialContent()}
            onChange={(data) => handleContentChange(JSON.stringify(data))}
            className="h-full"
          />
        )}

        {document.type === "presentation" && (
          <PresentationEditor
            data={getInitialContent()}
            onChange={(data) => handleContentChange(JSON.stringify(data))}
            className="h-full"
          />
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Collaborative editing coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Real-time collaboration with multiple users will be available in a future update.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Share link</label>
              <div className="flex gap-2">
                <Input
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/office/${document.id}`}
                  readOnly
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/office/${document.id}`)
                    toast.success("Link copied to clipboard")
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
