"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TextAlign } from "@tiptap/extension-text-align"
import { Underline } from "@tiptap/extension-underline"
import { Highlight } from "@tiptap/extension-highlight"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Link } from "@tiptap/extension-link"
import { Image } from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { useCallback, useEffect, useState } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Undo,
  Redo,
  Minus,
  Plus,
  Palette,
  MoreHorizontal,
  Trash2,
  TableCellsMerge,
  Columns,
  Rows,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface DocumentEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
]

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000", "#0000ff",
  "#ffc000", "#92d050", "#00b0f0", "#7030a0", "#c00000", "#002060",
]

export function DocumentEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className,
}: DocumentEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-2 relative",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-border p-2 bg-muted font-semibold",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose pl-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-4",
          "prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
          "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
          "prose-table:border-collapse prose-td:border prose-th:border"
        ),
      },
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setLinkUrl("")
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
  }, [editor, imageUrl])

  const insertTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-card overflow-hidden", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {editor.isActive("heading", { level: 1 }) ? (
                  <Heading1 className="h-4 w-4" />
                ) : editor.isActive("heading", { level: 2 }) ? (
                  <Heading2 className="h-4 w-4" />
                ) : editor.isActive("heading", { level: 3 }) ? (
                  <Heading3 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">Normal</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <span className="text-sm">Normal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="mr-2 h-4 w-4" />
                <span className="text-xl font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="mr-2 h-4 w-4" />
                <span className="text-lg font-bold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="mr-2 h-4 w-4" />
                <span className="text-base font-bold">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive("bold") && "bg-muted")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive("italic") && "bg-muted")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(editor.isActive("underline") && "bg-muted")}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(editor.isActive("strike") && "bg-muted")}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive("code") && "bg-muted")}
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-10 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Remove color
              </Button>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Remove highlight
              </Button>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(editor.isActive({ textAlign: "left" }) && "bg-muted")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(editor.isActive({ textAlign: "center" }) && "bg-muted")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(editor.isActive({ textAlign: "right" }) && "bg-muted")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={cn(editor.isActive({ textAlign: "justify" }) && "bg-muted")}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive("bulletList") && "bg-muted")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive("orderedList") && "bg-muted")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn(editor.isActive("taskList") && "bg-muted")}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive("blockquote") && "bg-muted")}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(editor.isActive("link") && "bg-muted")}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addLink}>
                    Add Link
                  </Button>
                  {editor.isActive("link") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editor.chain().focus().unsetLink().run()}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                />
                <Button size="sm" onClick={addImage}>
                  Insert Image
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Table */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(editor.isActive("table") && "bg-muted")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={insertTable}>
                <Plus className="mr-2 h-4 w-4" />
                Insert Table
              </DropdownMenuItem>
              {editor.isActive("table") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                    <Columns className="mr-2 h-4 w-4" />
                    Add Column Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                    <Columns className="mr-2 h-4 w-4" />
                    Add Column After
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                    <Minus className="mr-2 h-4 w-4" />
                    Delete Column
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                    <Rows className="mr-2 h-4 w-4" />
                    Add Row Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                    <Rows className="mr-2 h-4 w-4" />
                    Add Row After
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                    <Minus className="mr-2 h-4 w-4" />
                    Delete Row
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                    <TableCellsMerge className="mr-2 h-4 w-4" />
                    Merge Cells
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                    <TableCellsMerge className="mr-2 h-4 w-4" />
                    Split Cell
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Table
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Horizontal Rule */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
