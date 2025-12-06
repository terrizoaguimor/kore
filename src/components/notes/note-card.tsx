"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Pin, Archive, MoreHorizontal, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Note } from "@/types/database"

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onTogglePin: (noteId: string, isPinned: boolean) => Promise<void>
  onToggleArchive: (noteId: string, isArchived: boolean) => Promise<void>
  onDelete: (noteId: string) => Promise<void>
}

export function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: NoteCardProps) {
  // Get plain text preview from content
  const getPreview = (content: string | null) => {
    if (!content) return ""
    // Remove markdown formatting for preview
    const plainText = content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n/g, " ")
    return plainText.slice(0, 150) + (plainText.length > 150 ? "..." : "")
  }

  const tags = Array.isArray(note.tags) ? (note.tags as string[]) : []

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        note.is_pinned && "border-primary"
      )}
      onClick={() => onEdit(note)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {note.is_pinned && (
              <Pin className="h-4 w-4 text-primary fill-primary" />
            )}
            <h3 className="font-semibold line-clamp-1">{note.title}</h3>
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(note)
              }}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onTogglePin(note.id, !note.is_pinned)
              }}>
                <Pin className="mr-2 h-4 w-4" />
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onToggleArchive(note.id, !note.is_archived)
              }}>
                <Archive className="mr-2 h-4 w-4" />
                {note.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {getPreview(note.content) || "No content"}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          {format(new Date(note.updated_at), "MMM d, yyyy", { locale: es })}
        </span>
        {tags.length > 0 && (
          <div className="flex gap-1">
            {tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
