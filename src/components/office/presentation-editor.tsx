"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize2,
  Image as ImageIcon,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Move,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  Layers,
  ArrowUp,
  ArrowDown,
  X,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface SlideElement {
  id: string
  type: "text" | "image" | "shape"
  x: number
  y: number
  width: number
  height: number
  content?: string
  src?: string
  shape?: "rectangle" | "circle" | "triangle"
  style?: {
    fontSize?: number
    fontWeight?: string
    fontStyle?: string
    textDecoration?: string
    textAlign?: string
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }
  zIndex?: number
}

interface Slide {
  id: string
  backgroundColor?: string
  backgroundImage?: string
  elements: SlideElement[]
}

interface PresentationData {
  slides: Slide[]
  settings?: {
    aspectRatio?: "16:9" | "4:3"
    theme?: string
  }
}

interface PresentationEditorProps {
  data: PresentationData
  onChange: (data: PresentationData) => void
  editable?: boolean
  className?: string
}

const COLORS = [
  "#ffffff", "#f3f3f3", "#000000", "#434343", "#666666",
  "#e53935", "#d81b60", "#8e24aa", "#5e35b1", "#3949ab",
  "#1e88e5", "#039be5", "#00acc1", "#00897b", "#43a047",
  "#7cb342", "#c0ca33", "#fdd835", "#ffb300", "#fb8c00",
  "#f4511e", "#6d4c41", "#757575", "#546e7a",
]

const SLIDE_THEMES = [
  { id: "white", bg: "#ffffff", text: "#000000" },
  { id: "dark", bg: "#1a1a2e", text: "#ffffff" },
  { id: "blue", bg: "#1e3a5f", text: "#ffffff" },
  { id: "gradient-purple", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff" },
  { id: "gradient-orange", bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: "#ffffff" },
  { id: "gradient-green", bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", text: "#ffffff" },
]

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function PresentationEditor({
  data,
  onChange,
  editable = true,
  className,
}: PresentationEditorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [history, setHistory] = useState<PresentationData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const slideRef = useRef<HTMLDivElement>(null)
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const currentSlide = data.slides[currentSlideIndex]
  const selectedElementData = currentSlide?.elements.find((el) => el.id === selectedElement)

  // Save to history
  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(data))])
    setHistoryIndex((prev) => prev + 1)
  }, [data, historyIndex])

  // Update slides
  const updateSlides = useCallback(
    (newSlides: Slide[]) => {
      saveToHistory()
      onChange({ ...data, slides: newSlides })
    },
    [data, onChange, saveToHistory]
  )

  // Add new slide
  const addSlide = useCallback(() => {
    const newSlide: Slide = {
      id: generateId(),
      backgroundColor: "#ffffff",
      elements: [],
    }
    updateSlides([...data.slides, newSlide])
    setCurrentSlideIndex(data.slides.length)
  }, [data.slides, updateSlides])

  // Duplicate slide
  const duplicateSlide = useCallback(() => {
    const newSlide: Slide = {
      ...JSON.parse(JSON.stringify(currentSlide)),
      id: generateId(),
      elements: currentSlide.elements.map((el) => ({ ...el, id: generateId() })),
    }
    const newSlides = [...data.slides]
    newSlides.splice(currentSlideIndex + 1, 0, newSlide)
    updateSlides(newSlides)
    setCurrentSlideIndex(currentSlideIndex + 1)
  }, [currentSlide, currentSlideIndex, data.slides, updateSlides])

  // Delete slide
  const deleteSlide = useCallback(() => {
    if (data.slides.length <= 1) return
    const newSlides = data.slides.filter((_, i) => i !== currentSlideIndex)
    updateSlides(newSlides)
    setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1))
  }, [currentSlideIndex, data.slides, updateSlides])

  // Add element
  const addElement = useCallback(
    (type: SlideElement["type"], options?: Partial<SlideElement>) => {
      const newElement: SlideElement = {
        id: generateId(),
        type,
        x: 100,
        y: 100,
        width: type === "text" ? 400 : 200,
        height: type === "text" ? 100 : 200,
        content: type === "text" ? "Click to edit text" : undefined,
        shape: type === "shape" ? "rectangle" : undefined,
        style: {
          fontSize: 24,
          color: "#000000",
          backgroundColor: type === "shape" ? "#3b82f6" : "transparent",
        },
        zIndex: currentSlide.elements.length,
        ...options,
      }
      const newSlides = [...data.slides]
      newSlides[currentSlideIndex] = {
        ...currentSlide,
        elements: [...currentSlide.elements, newElement],
      }
      updateSlides(newSlides)
      setSelectedElement(newElement.id)
    },
    [currentSlide, currentSlideIndex, data.slides, updateSlides]
  )

  // Update element
  const updateElement = useCallback(
    (elementId: string, updates: Partial<SlideElement>) => {
      const newSlides = [...data.slides]
      const elementIndex = currentSlide.elements.findIndex((el) => el.id === elementId)
      if (elementIndex === -1) return

      newSlides[currentSlideIndex] = {
        ...currentSlide,
        elements: currentSlide.elements.map((el, i) =>
          i === elementIndex ? { ...el, ...updates } : el
        ),
      }
      onChange({ ...data, slides: newSlides })
    },
    [currentSlide, currentSlideIndex, data, onChange]
  )

  // Delete element
  const deleteElement = useCallback(() => {
    if (!selectedElement) return
    const newSlides = [...data.slides]
    newSlides[currentSlideIndex] = {
      ...currentSlide,
      elements: currentSlide.elements.filter((el) => el.id !== selectedElement),
    }
    updateSlides(newSlides)
    setSelectedElement(null)
  }, [currentSlide, currentSlideIndex, data.slides, selectedElement, updateSlides])

  // Handle mouse down on element
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (!editable) return
      e.stopPropagation()
      setSelectedElement(elementId)

      const element = currentSlide.elements.find((el) => el.id === elementId)
      if (!element) return

      const rect = elementRefs.current[elementId]?.getBoundingClientRect()
      if (!rect) return

      setIsDragging(true)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    [currentSlide.elements, editable]
  )

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging || !selectedElement || !slideRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const slideRect = slideRef.current?.getBoundingClientRect()
      if (!slideRect) return

      const x = Math.max(0, e.clientX - slideRect.left - dragOffset.x)
      const y = Math.max(0, e.clientY - slideRect.top - dragOffset.y)

      updateElement(selectedElement, { x, y })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      saveToHistory()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, selectedElement, dragOffset, updateElement, saveToHistory])

  // Handle resize
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
    },
    []
  )

  useEffect(() => {
    if (!isResizing || !selectedElement || !resizeHandle || !slideRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const element = currentSlide.elements.find((el) => el.id === selectedElement)
      if (!element) return

      const slideRect = slideRef.current?.getBoundingClientRect()
      if (!slideRect) return

      const mouseX = e.clientX - slideRect.left
      const mouseY = e.clientY - slideRect.top

      let updates: Partial<SlideElement> = {}

      switch (resizeHandle) {
        case "se":
          updates = {
            width: Math.max(50, mouseX - element.x),
            height: Math.max(50, mouseY - element.y),
          }
          break
        case "e":
          updates = { width: Math.max(50, mouseX - element.x) }
          break
        case "s":
          updates = { height: Math.max(50, mouseY - element.y) }
          break
      }

      updateElement(selectedElement, updates)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
      saveToHistory()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, selectedElement, resizeHandle, currentSlide.elements, updateElement, saveToHistory])

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      onChange(history[historyIndex])
      setHistoryIndex((prev) => prev - 1)
    }
  }, [history, historyIndex, onChange])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      onChange(history[historyIndex + 1])
    }
  }, [history, historyIndex, onChange])

  // Add image
  const addImage = useCallback(() => {
    if (!imageUrl) return
    addElement("image", { src: imageUrl, width: 300, height: 200 })
    setShowImageDialog(false)
    setImageUrl("")
  }, [imageUrl, addElement])

  // Update slide background
  const updateSlideBackground = useCallback(
    (bg: string) => {
      const newSlides = [...data.slides]
      newSlides[currentSlideIndex] = {
        ...currentSlide,
        backgroundColor: bg,
      }
      updateSlides(newSlides)
    },
    [currentSlide, currentSlideIndex, data.slides, updateSlides]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElement && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault()
          deleteElement()
        }
      }
      if (e.key === "Escape") {
        setSelectedElement(null)
        setIsPresentationMode(false)
      }
      if (e.key === "ArrowLeft" && isPresentationMode) {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1))
      }
      if (e.key === "ArrowRight" && isPresentationMode) {
        setCurrentSlideIndex((prev) => Math.min(data.slides.length - 1, prev + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo, selectedElement, deleteElement, isPresentationMode, data.slides.length])

  // Presentation Mode
  if (isPresentationMode) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-none"
        onClick={() => setCurrentSlideIndex((prev) => Math.min(data.slides.length - 1, prev + 1))}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={(e) => {
            e.stopPropagation()
            setIsPresentationMode(false)
          }}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          {currentSlideIndex + 1} / {data.slides.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-6xl aspect-video relative"
            style={{
              background: currentSlide.backgroundColor || "#ffffff",
            }}
          >
            {currentSlide.elements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${(element.x / 960) * 100}%`,
                  top: `${(element.y / 540) * 100}%`,
                  width: `${(element.width / 960) * 100}%`,
                  height: `${(element.height / 540) * 100}%`,
                  zIndex: element.zIndex,
                }}
              >
                {element.type === "text" && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      fontSize: `${((element.style?.fontSize || 24) / 24) * 2}vw`,
                      fontWeight: element.style?.fontWeight,
                      fontStyle: element.style?.fontStyle,
                      textDecoration: element.style?.textDecoration,
                      textAlign: (element.style?.textAlign as any) || "center",
                      color: element.style?.color,
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === "image" && (
                  <img
                    src={element.src}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
                {element.type === "shape" && (
                  <div
                    className={cn(
                      "w-full h-full",
                      element.shape === "circle" && "rounded-full",
                      element.shape === "triangle" && "clip-path-triangle"
                    )}
                    style={{ backgroundColor: element.style?.backgroundColor }}
                  />
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex < 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Add Elements */}
          <Button variant="ghost" size="sm" onClick={() => addElement("text")}>
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowImageDialog(true)}>
            <ImageIcon className="h-4 w-4 mr-1" />
            Image
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Shape
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addElement("shape", { shape: "rectangle" })}>
                <Square className="mr-2 h-4 w-4" />
                Rectangle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("shape", { shape: "circle" })}>
                <Circle className="mr-2 h-4 w-4" />
                Circle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("shape", { shape: "triangle" })}>
                <Triangle className="mr-2 h-4 w-4" />
                Triangle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Element Formatting */}
          {selectedElementData?.type === "text" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateElement(selectedElement!, {
                    style: { ...selectedElementData.style, fontWeight: selectedElementData.style?.fontWeight === "bold" ? "normal" : "bold" },
                  })
                }
                className={cn(selectedElementData.style?.fontWeight === "bold" && "bg-muted")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateElement(selectedElement!, {
                    style: { ...selectedElementData.style, fontStyle: selectedElementData.style?.fontStyle === "italic" ? "normal" : "italic" },
                  })
                }
                className={cn(selectedElementData.style?.fontStyle === "italic" && "bg-muted")}
              >
                <Italic className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateElement(selectedElement!, { style: { ...selectedElementData.style, textAlign: "left" } })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateElement(selectedElement!, { style: { ...selectedElementData.style, textAlign: "center" } })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateElement(selectedElement!, { style: { ...selectedElementData.style, textAlign: "right" } })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          updateElement(selectedElement!, { style: { ...selectedElementData.style, color } })
                        }
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}

          {selectedElementData?.type === "shape" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Palette className="h-4 w-4" />
                  Fill
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        updateElement(selectedElement!, { style: { ...selectedElementData.style, backgroundColor: color } })
                      }
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {selectedElement && (
            <Button variant="ghost" size="sm" onClick={deleteElement} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <div className="flex-1" />

          {/* Slide Background */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-1" />
                Background
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-3 gap-2">
                {SLIDE_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    className="w-16 h-10 rounded border hover:scale-105 transition-transform"
                    style={{ background: theme.bg }}
                    onClick={() => updateSlideBackground(theme.bg)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="default" size="sm" onClick={() => setIsPresentationMode(true)}>
            <Play className="h-4 w-4 mr-1" />
            Present
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Thumbnails */}
        <div className="w-48 border-r bg-muted/20 overflow-y-auto p-2 space-y-2">
          {data.slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                currentSlideIndex === index ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
              )}
              onClick={() => setCurrentSlideIndex(index)}
            >
              <div className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                {index + 1}
              </div>
              <div
                className="aspect-video"
                style={{ background: slide.backgroundColor || "#ffffff" }}
              >
                {/* Mini preview of elements */}
                {slide.elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: `${(el.x / 960) * 100}%`,
                      top: `${(el.y / 540) * 100}%`,
                      width: `${(el.width / 960) * 100}%`,
                      height: `${(el.height / 540) * 100}%`,
                      backgroundColor: el.type === "shape" ? el.style?.backgroundColor : "transparent",
                      borderRadius: el.shape === "circle" ? "50%" : 0,
                    }}
                  >
                    {el.type === "text" && (
                      <div className="text-[4px] truncate" style={{ color: el.style?.color }}>
                        {el.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editable && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentSlideIndex(index)
                      duplicateSlide()
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {data.slides.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentSlideIndex(index)
                        setTimeout(deleteSlide, 0)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          {editable && (
            <Button
              variant="outline"
              className="w-full aspect-video flex-col gap-1"
              onClick={addSlide}
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Slide</span>
            </Button>
          )}
        </div>

        {/* Slide Editor */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/10 overflow-auto">
          <div
            ref={slideRef}
            className="relative shadow-2xl"
            style={{
              width: 960,
              height: 540,
              background: currentSlide?.backgroundColor || "#ffffff",
            }}
            onClick={() => setSelectedElement(null)}
          >
            {currentSlide?.elements.map((element) => {
              const isSelected = selectedElement === element.id

              return (
                <div
                  key={element.id}
                  ref={(el) => { elementRefs.current[element.id] = el }}
                  className={cn(
                    "absolute cursor-move",
                    isSelected && "ring-2 ring-primary"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    zIndex: element.zIndex,
                  }}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {element.type === "text" && (
                    <div
                      contentEditable={editable && isSelected}
                      suppressContentEditableWarning
                      className="w-full h-full p-2 outline-none overflow-hidden"
                      style={{
                        fontSize: element.style?.fontSize,
                        fontWeight: element.style?.fontWeight,
                        fontStyle: element.style?.fontStyle,
                        textDecoration: element.style?.textDecoration,
                        textAlign: (element.style?.textAlign as any) || "left",
                        color: element.style?.color,
                      }}
                      onBlur={(e) => {
                        updateElement(element.id, { content: e.currentTarget.textContent || "" })
                        saveToHistory()
                      }}
                    >
                      {element.content}
                    </div>
                  )}

                  {element.type === "image" && (
                    <img
                      src={element.src}
                      alt=""
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                  )}

                  {element.type === "shape" && (
                    <div
                      className={cn(
                        "w-full h-full",
                        element.shape === "circle" && "rounded-full",
                        element.shape === "triangle" && "clip-path-triangle"
                      )}
                      style={{ backgroundColor: element.style?.backgroundColor }}
                    />
                  )}

                  {/* Resize Handles */}
                  {isSelected && editable && (
                    <>
                      <div
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-primary cursor-e-resize"
                        onMouseDown={(e) => handleResizeMouseDown(e, "e")}
                      />
                      <div
                        className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-6 h-2 bg-primary cursor-s-resize"
                        onMouseDown={(e) => handleResizeMouseDown(e, "s")}
                      />
                      <div
                        className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary cursor-se-resize rounded-full"
                        onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Slide {currentSlideIndex + 1} of {data.slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlideIndex((prev) => Math.min(data.slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === data.slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedElement ? "Press Delete to remove • Drag to move • Drag corners to resize" : "Click to select an element"}
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <Button onClick={addImage} disabled={!imageUrl}>
              Insert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .clip-path-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  )
}
