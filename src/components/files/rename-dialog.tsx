"use client"

import { useState, useEffect } from "react"
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
import type { File as FileType } from "@/types/database"

interface RenameDialogProps {
  file: FileType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: (file: FileType, newName: string) => Promise<any>
}

export function RenameDialog({ file, open, onOpenChange, onRename }: RenameDialogProps) {
  const [name, setName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  useEffect(() => {
    if (file) {
      setName(file.name)
    }
  }, [file])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name.trim() || name === file.name) return

    setIsRenaming(true)
    try {
      const result = await onRename(file, name.trim())
      if (result) {
        onOpenChange(false)
      }
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for "{file?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">New name</Label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isRenaming}
                autoFocus
                onFocus={(e) => {
                  // Select filename without extension
                  const lastDot = e.target.value.lastIndexOf(".")
                  if (lastDot > 0) {
                    e.target.setSelectionRange(0, lastDot)
                  } else {
                    e.target.select()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || name === file?.name || isRenaming}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
