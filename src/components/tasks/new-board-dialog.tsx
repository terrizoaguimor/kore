"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const colors = [
  "#2f62ea", // Royal Blue
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#64748b", // Slate
]

interface NewBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBoard: (name: string, color: string) => Promise<void>
}

export function NewBoardDialog({
  open,
  onOpenChange,
  onCreateBoard,
}: NewBoardDialogProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(colors[0])
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    try {
      await onCreateBoard(name.trim(), color)
      setName("")
      setColor(colors[0])
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a new task board to organize your work.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
