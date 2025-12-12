"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  FileText,
  Table2,
  Presentation,
  MoreHorizontal,
  Trash2,
  Star,
  Clock,
  FolderOpen,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

const documentTypes: { type: DocumentType; label: string; icon: typeof FileText; color: string }[] = [
  { type: "document", label: "Document", icon: FileText, color: "#0046E2" },
  { type: "spreadsheet", label: "Spreadsheet", icon: Table2, color: "#00D68F" },
  { type: "presentation", label: "Presentation", icon: Presentation, color: "#FF4757" },
]

const getDocumentIcon = (type: DocumentType) => {
  const config = documentTypes.find((d) => d.type === type)
  return config || documentTypes[0]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `Today ${hours}:${minutes}`
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function OfficePage() {
  const router = useRouter()
  const { user, organization } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newDocDialogOpen, setNewDocDialogOpen] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocType, setNewDocType] = useState<DocumentType>("document")

  const supabase = createClient()
  const db = supabase as any

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!organization) return

    try {
      const { data, error } = await db
        .from("office_documents")
        .select("*")
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setDocuments((data as Document[]) || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }, [organization, db])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Create document
  const handleCreateDocument = async () => {
    if (!organization || !user || !newDocName.trim()) return

    try {
      const { data, error } = await db
        .from("office_documents")
        .insert({
          organization_id: organization.id,
          owner_id: user.id,
          name: newDocName.trim(),
          type: newDocType,
          content: "",
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Document created")
      setNewDocDialogOpen(false)
      setNewDocName("")
      router.push(`/office/${(data as Document).id}`)
    } catch (error) {
      console.error("Error creating document:", error)
      toast.error("Failed to create document")
    }
  }

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await db
        .from("office_documents")
        .delete()
        .eq("id", docId)

      if (error) throw error

      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("Document deleted")
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("Failed to delete document")
    }
  }

  // Toggle star
  const handleToggleStar = async (doc: Document) => {
    try {
      const { error } = await db
        .from("office_documents")
        .update({ is_starred: !doc.is_starred })
        .eq("id", doc.id)

      if (error) throw error

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, is_starred: !d.is_starred } : d
        )
      )
    } catch (error) {
      console.error("Error updating document:", error)
      toast.error("Failed to update document")
    }
  }

  // Open document
  const handleOpenDocument = (docId: string) => {
    router.push(`/office/${docId}`)
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please log in to access Office</p>
      </div>
    )
  }

  const starredDocs = filteredDocuments.filter((d) => d.is_starred)
  const recentDocs = filteredDocuments.filter((d) => !d.is_starred)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Office</h1>
        <Button onClick={() => setNewDocDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Search & Quick Create */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            {documentTypes.map((docType) => {
              const Icon = docType.icon
              return (
                <Button
                  key={docType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewDocType(docType.type)
                    setNewDocDialogOpen(true)
                  }}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" style={{ color: docType.color }} />
                  {docType.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? "No documents match your search"
                : "Create your first document to get started"}
            </p>
            {!searchQuery && (
              <div className="mt-6 flex gap-2">
                {documentTypes.map((docType) => {
                  const Icon = docType.icon
                  return (
                    <Button
                      key={docType.type}
                      variant="outline"
                      onClick={() => {
                        setNewDocType(docType.type)
                        setNewDocDialogOpen(true)
                      }}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" style={{ color: docType.color }} />
                      New {docType.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Starred Documents */}
            {starredDocs.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Starred
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {starredDocs.map((doc) => {
                    const config = getDocumentIcon(doc.type)
                    const Icon = config.icon
                    return (
                      <Card
                        key={doc.id}
                        className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                        onClick={() => handleOpenDocument(doc.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div
                              className="rounded-lg p-2"
                              style={{ backgroundColor: `${config.color}15` }}
                            >
                              <Icon
                                className="h-8 w-8"
                                style={{ color: config.color }}
                              />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleToggleStar(doc)}>
                                  <Star className={cn("mr-2 h-4 w-4", doc.is_starred && "fill-yellow-400 text-yellow-400")} />
                                  {doc.is_starred ? "Remove star" : "Add star"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h3 className="mt-3 font-medium truncate">{doc.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.updated_at)}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Documents */}
            {recentDocs.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Recent
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentDocs.map((doc) => {
                    const config = getDocumentIcon(doc.type)
                    const Icon = config.icon
                    return (
                      <Card
                        key={doc.id}
                        className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                        onClick={() => handleOpenDocument(doc.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div
                              className="rounded-lg p-2"
                              style={{ backgroundColor: `${config.color}15` }}
                            >
                              <Icon
                                className="h-8 w-8"
                                style={{ color: config.color }}
                              />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleToggleStar(doc)}>
                                  <Star className={cn("mr-2 h-4 w-4", doc.is_starred && "fill-yellow-400 text-yellow-400")} />
                                  {doc.is_starred ? "Remove star" : "Add star"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h3 className="mt-3 font-medium truncate">{doc.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.updated_at)}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Document Dialog */}
      <Dialog open={newDocDialogOpen} onOpenChange={setNewDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                placeholder="Untitled document"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {documentTypes.map((docType) => {
                  const Icon = docType.icon
                  return (
                    <button
                      key={docType.type}
                      onClick={() => setNewDocType(docType.type)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                        newDocType === docType.type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className="h-8 w-8" style={{ color: docType.color }} />
                      <span className="text-sm">{docType.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDocDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument} disabled={!newDocName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
