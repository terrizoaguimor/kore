"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  ArrowLeft,
  Pin,
  Archive,
  Trash2,
  Save,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Link2,
  Quote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Note } from "@/types/database"

interface NoteEditorProps {
  note: Note | null
  isNew?: boolean
  onSave: (updates: Partial<Note>) => Promise<void>
  onDelete?: (noteId: string) => Promise<void>
  onBack: () => void
}

export function NoteEditor({
  note,
  isNew = false,
  onSave,
  onDelete,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [isPinned, setIsPinned] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || "")
      setTags(Array.isArray(note.tags) ? (note.tags as string[]).join(", ") : "")
      setIsPinned(note.is_pinned)
      setHasChanges(false)
    } else {
      setTitle("")
      setContent("")
      setTags("")
      setIsPinned(false)
      setHasChanges(false)
    }
  }, [note])

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        content: content.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_pinned: isPinned,
      })
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = () => {
    setHasChanges(true)
  }

  const insertMarkdown = (syntax: string, wrap: boolean = false) => {
    const textarea = document.getElementById("note-content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = content

    if (wrap) {
      newText = content.substring(0, start) + syntax + selectedText + syntax + content.substring(end)
    } else {
      newText = content.substring(0, start) + syntax + content.substring(end)
    }

    setContent(newText)
    setHasChanges(true)

    // Restore focus
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + syntax.length
      textarea.selectionEnd = start + syntax.length + selectedText.length
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", true) },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", true) },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", true) },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    { icon: Link2, label: "Link", action: () => insertMarkdown("[](url)") },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {isNew ? "New Note" : note ? `Updated ${format(new Date(note.updated_at), "MMM d, yyyy HH:mm")}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPinned ? "default" : "ghost"}
                  size="icon"
                  onClick={() => {
                    setIsPinned(!isPinned)
                    setHasChanges(true)
                  }}
                >
                  <Pin className={cn("h-5 w-5", isPinned && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPinned ? "Unpin" : "Pin"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {note && onDelete && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              handleChange()
            }}
            placeholder="Note title..."
            className="border-0 text-2xl font-bold focus-visible:ring-0"
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 rounded-md border p-1">
            {toolbarButtons.map(({ icon: Icon, label, action }) => (
              <TooltipProvider key={label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={action}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              handleChange()
            }}
            placeholder="Start writing..."
            className="min-h-[400px] resize-none border-0 text-base focus-visible:ring-0"
          />

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tags (comma-separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => {
                setTags(e.target.value)
                handleChange()
              }}
              placeholder="work, ideas, important..."
            />
            {tags && (
              <div className="flex flex-wrap gap-1 pt-2">
                {tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
