"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, StickyNote, Pin, Archive, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NoteCard } from "@/components/notes/note-card"
import { NoteEditor } from "@/components/notes/note-editor"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import type { Note } from "@/types/database"

type ViewMode = "grid" | "editor"
type FilterMode = "all" | "pinned" | "archived"

export default function NotesPage() {
  const { user, organization } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isNewNote, setIsNewNote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (!organization) return

    try {
      let query = supabase
        .from("notes")
        .select("*")
        .eq("organization_id", organization.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })

      if (filterMode === "pinned") {
        query = query.eq("is_pinned", true)
      } else if (filterMode === "archived") {
        query = query.eq("is_archived", true)
      } else {
        query = query.eq("is_archived", false)
      }

      const { data, error } = await query

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [organization, supabase, filterMode])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Filter notes by search query
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const titleMatch = note.title.toLowerCase().includes(query)
    const contentMatch = note.content?.toLowerCase().includes(query)
    const tagsMatch = Array.isArray(note.tags) &&
      (note.tags as string[]).some((t) => t.toLowerCase().includes(query))
    return titleMatch || contentMatch || tagsMatch
  })

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned && !n.is_archived)
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned && !n.is_archived)
  const archivedNotes = filteredNotes.filter((n) => n.is_archived)

  // Create note
  const handleCreateNote = async (updates: Partial<Note>) => {
    if (!organization || !user) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("notes")
        .insert({
          organization_id: organization.id,
          owner_id: user.id,
          title: updates.title || "Untitled",
          content: updates.content,
          tags: updates.tags || [],
          is_pinned: updates.is_pinned || false,
        })
        .select()
        .single()

      if (error) throw error

      setNotes((prev) => [data, ...prev])
      setSelectedNote(data)
      setIsNewNote(false)
      toast.success("Note created")
    } catch (error) {
      console.error("Error creating note:", error)
      toast.error("Failed to create note")
    }
  }

  // Update note
  const handleUpdateNote = async (updates: Partial<Note>) => {
    if (!selectedNote) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", selectedNote.id)

      if (error) throw error

      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id ? { ...n, ...updates } : n
        )
      )
      setSelectedNote((prev) => prev ? { ...prev, ...updates } : null)
      toast.success("Note saved")
    } catch (error) {
      console.error("Error updating note:", error)
      toast.error("Failed to save note")
    }
  }

  // Toggle pin
  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("notes")
        .update({ is_pinned: isPinned })
        .eq("id", noteId)

      if (error) throw error

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_pinned: isPinned } : n))
      )
      toast.success(isPinned ? "Note pinned" : "Note unpinned")
    } catch (error) {
      console.error("Error updating note:", error)
      toast.error("Failed to update note")
    }
  }

  // Toggle archive
  const handleToggleArchive = async (noteId: string, isArchived: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("notes")
        .update({ is_archived: isArchived })
        .eq("id", noteId)

      if (error) throw error

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_archived: isArchived } : n))
      )
      toast.success(isArchived ? "Note archived" : "Note restored")
    } catch (error) {
      console.error("Error updating note:", error)
      toast.error("Failed to update note")
    }
  }

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)

      if (error) throw error

      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        setViewMode("grid")
      }
      toast.success("Note deleted")
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note")
    }
  }

  // Edit note
  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setIsNewNote(false)
    setViewMode("editor")
  }

  // New note
  const handleNewNote = () => {
    setSelectedNote(null)
    setIsNewNote(true)
    setViewMode("editor")
  }

  // Back to grid
  const handleBack = () => {
    setSelectedNote(null)
    setIsNewNote(false)
    setViewMode("grid")
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please log in to access Notes</p>
      </div>
    )
  }

  // Editor view
  if (viewMode === "editor") {
    return (
      <NoteEditor
        note={selectedNote}
        isNew={isNewNote}
        onSave={isNewNote ? handleCreateNote : handleUpdateNote}
        onDelete={selectedNote ? handleDeleteNote : undefined}
        onBack={handleBack}
      />
    )
  }

  // Grid view
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Button onClick={handleNewNote}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      <div className="border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterMode === "all" ? "All Notes" : filterMode === "pinned" ? "Pinned" : "Archived"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={filterMode === "all"}
                onCheckedChange={() => setFilterMode("all")}
              >
                All Notes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterMode === "pinned"}
                onCheckedChange={() => setFilterMode("pinned")}
              >
                <Pin className="mr-2 h-4 w-4" />
                Pinned
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterMode === "archived"}
                onCheckedChange={() => setFilterMode("archived")}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <StickyNote className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No notes yet</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? "No notes match your search"
                  : "Create your first note to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleNewNote} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Note
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && filterMode !== "archived" && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Pin className="h-4 w-4" />
                    Pinned
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onTogglePin={handleTogglePin}
                        onToggleArchive={handleToggleArchive}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Notes */}
              {unpinnedNotes.length > 0 && filterMode !== "archived" && filterMode !== "pinned" && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                      Other Notes
                    </h2>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onTogglePin={handleTogglePin}
                        onToggleArchive={handleToggleArchive}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Notes */}
              {archivedNotes.length > 0 && filterMode === "archived" && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Archive className="h-4 w-4" />
                    Archived
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {archivedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onTogglePin={handleTogglePin}
                        onToggleArchive={handleToggleArchive}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
