"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  Table,
  Download,
  Upload,
  Palette,
  Type,
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"

interface CellData {
  value: string
  formula?: string
  style?: CellStyle
}

interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: "left" | "center" | "right"
  color?: string
  bgColor?: string
}

interface SpreadsheetData {
  cells: Record<string, CellData>
  colWidths: Record<number, number>
  rowHeights: Record<number, number>
}

interface SpreadsheetEditorProps {
  data: SpreadsheetData
  onChange: (data: SpreadsheetData) => void
  rows?: number
  cols?: number
  editable?: boolean
  className?: string
}

const DEFAULT_ROWS = 50
const DEFAULT_COLS = 26
const DEFAULT_COL_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 28

const COLORS = [
  "#ffffff", "#f3f3f3", "#efefef", "#d9d9d9", "#cccccc", "#b7b7b7", "#999999", "#666666",
  "#ffcdd2", "#f8bbd9", "#e1bee7", "#d1c4e9", "#c5cae9", "#bbdefb", "#b3e5fc", "#b2ebf2",
  "#c8e6c9", "#dcedc8", "#f0f4c3", "#fff9c4", "#ffecb3", "#ffe0b2", "#ffccbc", "#d7ccc8",
]

// Formula evaluation engine
function evaluateFormula(formula: string, cells: Record<string, CellData>): string | number {
  if (!formula.startsWith("=")) return formula

  const expression = formula.substring(1).toUpperCase()

  // Parse cell references (A1, B2, etc.)
  const cellRefRegex = /([A-Z]+)(\d+)/g
  let evaluatedExpression = expression

  // Replace cell references with values
  let match
  while ((match = cellRefRegex.exec(expression)) !== null) {
    const cellRef = match[0]
    const cellData = cells[cellRef]
    const cellValue = cellData?.value || "0"
    const numValue = isNaN(Number(cellValue)) ? 0 : Number(cellValue)
    evaluatedExpression = evaluatedExpression.replace(cellRef, String(numValue))
  }

  // Handle SUM function
  const sumMatch = evaluatedExpression.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/i)
  if (sumMatch) {
    const [, start, end] = sumMatch
    const startCol = start.match(/[A-Z]+/)?.[0] || "A"
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1")
    const endCol = end.match(/[A-Z]+/)?.[0] || "A"
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1")

    let sum = 0
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const ref = `${String.fromCharCode(col)}${row}`
        const val = cells[ref]?.value || "0"
        sum += isNaN(Number(val)) ? 0 : Number(val)
      }
    }
    evaluatedExpression = evaluatedExpression.replace(sumMatch[0], String(sum))
  }

  // Handle AVERAGE function
  const avgMatch = evaluatedExpression.match(/AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)/i)
  if (avgMatch) {
    const [, start, end] = avgMatch
    const startCol = start.match(/[A-Z]+/)?.[0] || "A"
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1")
    const endCol = end.match(/[A-Z]+/)?.[0] || "A"
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1")

    let sum = 0
    let count = 0
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const ref = `${String.fromCharCode(col)}${row}`
        const val = cells[ref]?.value || "0"
        const num = Number(val)
        if (!isNaN(num)) {
          sum += num
          count++
        }
      }
    }
    evaluatedExpression = evaluatedExpression.replace(avgMatch[0], String(count > 0 ? sum / count : 0))
  }

  // Handle COUNT function
  const countMatch = evaluatedExpression.match(/COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)/i)
  if (countMatch) {
    const [, start, end] = countMatch
    const startCol = start.match(/[A-Z]+/)?.[0] || "A"
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1")
    const endCol = end.match(/[A-Z]+/)?.[0] || "A"
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1")

    let count = 0
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const ref = `${String.fromCharCode(col)}${row}`
        const val = cells[ref]?.value
        if (val && !isNaN(Number(val))) {
          count++
        }
      }
    }
    evaluatedExpression = evaluatedExpression.replace(countMatch[0], String(count))
  }

  // Handle MIN function
  const minMatch = evaluatedExpression.match(/MIN\(([A-Z]+\d+):([A-Z]+\d+)\)/i)
  if (minMatch) {
    const [, start, end] = minMatch
    const startCol = start.match(/[A-Z]+/)?.[0] || "A"
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1")
    const endCol = end.match(/[A-Z]+/)?.[0] || "A"
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1")

    let min = Infinity
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const ref = `${String.fromCharCode(col)}${row}`
        const val = cells[ref]?.value || "0"
        const num = Number(val)
        if (!isNaN(num) && num < min) {
          min = num
        }
      }
    }
    evaluatedExpression = evaluatedExpression.replace(minMatch[0], String(min === Infinity ? 0 : min))
  }

  // Handle MAX function
  const maxMatch = evaluatedExpression.match(/MAX\(([A-Z]+\d+):([A-Z]+\d+)\)/i)
  if (maxMatch) {
    const [, start, end] = maxMatch
    const startCol = start.match(/[A-Z]+/)?.[0] || "A"
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1")
    const endCol = end.match(/[A-Z]+/)?.[0] || "A"
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1")

    let max = -Infinity
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const ref = `${String.fromCharCode(col)}${row}`
        const val = cells[ref]?.value || "0"
        const num = Number(val)
        if (!isNaN(num) && num > max) {
          max = num
        }
      }
    }
    evaluatedExpression = evaluatedExpression.replace(maxMatch[0], String(max === -Infinity ? 0 : max))
  }

  // Evaluate basic math expressions
  try {
    // Only allow numbers and basic operators
    if (/^[\d\s+\-*/().]+$/.test(evaluatedExpression)) {
      const result = Function(`"use strict"; return (${evaluatedExpression})`)()
      return typeof result === "number" ? (Number.isInteger(result) ? result : result.toFixed(2)) : result
    }
  } catch {
    return "#ERROR"
  }

  return evaluatedExpression
}

function getColumnLabel(index: number): string {
  let label = ""
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label
    index = Math.floor(index / 26) - 1
  }
  return label
}

export function SpreadsheetEditor({
  data,
  onChange,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  editable = true,
  className,
}: SpreadsheetEditorProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [formulaBarValue, setFormulaBarValue] = useState("")
  const [clipboard, setClipboard] = useState<Record<string, CellData> | null>(null)
  const [history, setHistory] = useState<SpreadsheetData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get cell display value (evaluate formula if needed)
  const getCellDisplayValue = useCallback(
    (cellRef: string): string => {
      const cellData = data.cells[cellRef]
      if (!cellData) return ""

      if (cellData.formula) {
        const result = evaluateFormula(cellData.formula, data.cells)
        return String(result)
      }

      return cellData.value
    },
    [data.cells]
  )

  // Update cell
  const updateCell = useCallback(
    (cellRef: string, value: string, style?: Partial<CellStyle>) => {
      const newData = { ...data }
      const existingCell = newData.cells[cellRef] || { value: "" }

      if (value.startsWith("=")) {
        newData.cells[cellRef] = {
          ...existingCell,
          formula: value,
          value: String(evaluateFormula(value, data.cells)),
          style: style ? { ...existingCell.style, ...style } : existingCell.style,
        }
      } else {
        newData.cells[cellRef] = {
          ...existingCell,
          value,
          formula: undefined,
          style: style ? { ...existingCell.style, ...style } : existingCell.style,
        }
      }

      // Save to history
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), data])
      setHistoryIndex((prev) => prev + 1)

      onChange(newData)
    },
    [data, onChange, historyIndex]
  )

  // Update cell style
  const updateCellStyle = useCallback(
    (cellRef: string, style: Partial<CellStyle>) => {
      const newData = { ...data }
      const existingCell = newData.cells[cellRef] || { value: "" }
      newData.cells[cellRef] = {
        ...existingCell,
        style: { ...existingCell.style, ...style },
      }
      onChange(newData)
    },
    [data, onChange]
  )

  // Handle cell click
  const handleCellClick = useCallback(
    (cellRef: string) => {
      setSelectedCell(cellRef)
      setSelectedRange(null)
      const cellData = data.cells[cellRef]
      setFormulaBarValue(cellData?.formula || cellData?.value || "")
    },
    [data.cells]
  )

  // Handle cell double-click (edit)
  const handleCellDoubleClick = useCallback(
    (cellRef: string) => {
      if (!editable) return
      setEditingCell(cellRef)
      const cellData = data.cells[cellRef]
      setEditValue(cellData?.formula || cellData?.value || "")
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [editable, data.cells]
  )

  // Handle edit complete
  const handleEditComplete = useCallback(() => {
    if (editingCell) {
      updateCell(editingCell, editValue)
      setEditingCell(null)
      setEditValue("")
    }
  }, [editingCell, editValue, updateCell])

  // Handle formula bar change
  const handleFormulaBarChange = useCallback(
    (value: string) => {
      setFormulaBarValue(value)
      if (selectedCell) {
        updateCell(selectedCell, value)
      }
    },
    [selectedCell, updateCell]
  )

  // Undo
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      onChange(history[historyIndex])
      setHistoryIndex((prev) => prev - 1)
    }
  }, [history, historyIndex, onChange])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      onChange(history[historyIndex + 1])
    }
  }, [history, historyIndex, onChange])

  // Copy selected cell
  const copyCell = useCallback(() => {
    if (selectedCell) {
      setClipboard({ [selectedCell]: data.cells[selectedCell] || { value: "" } })
    }
  }, [selectedCell, data.cells])

  // Cut selected cell
  const cutCell = useCallback(() => {
    if (selectedCell) {
      setClipboard({ [selectedCell]: data.cells[selectedCell] || { value: "" } })
      updateCell(selectedCell, "")
    }
  }, [selectedCell, data.cells, updateCell])

  // Paste
  const pasteCell = useCallback(() => {
    if (selectedCell && clipboard) {
      const clipboardData = Object.values(clipboard)[0]
      if (clipboardData) {
        updateCell(selectedCell, clipboardData.formula || clipboardData.value, clipboardData.style)
      }
    }
  }, [selectedCell, clipboard, updateCell])

  // Apply style to selected cell
  const applyStyle = useCallback(
    (style: Partial<CellStyle>) => {
      if (selectedCell) {
        updateCellStyle(selectedCell, style)
      }
    },
    [selectedCell, updateCellStyle]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return

      const col = selectedCell.match(/[A-Z]+/)?.[0] || "A"
      const row = parseInt(selectedCell.match(/\d+/)?.[0] || "1")

      if (editingCell) {
        if (e.key === "Enter") {
          e.preventDefault()
          handleEditComplete()
        } else if (e.key === "Escape") {
          setEditingCell(null)
          setEditValue("")
        }
        return
      }

      switch (e.key) {
        case "ArrowUp":
          if (row > 1) {
            setSelectedCell(`${col}${row - 1}`)
          }
          break
        case "ArrowDown":
          if (row < rows) {
            setSelectedCell(`${col}${row + 1}`)
          }
          break
        case "ArrowLeft":
          if (col > "A") {
            setSelectedCell(`${String.fromCharCode(col.charCodeAt(0) - 1)}${row}`)
          }
          break
        case "ArrowRight":
          if (col.charCodeAt(0) < 65 + cols - 1) {
            setSelectedCell(`${String.fromCharCode(col.charCodeAt(0) + 1)}${row}`)
          }
          break
        case "Enter":
          handleCellDoubleClick(selectedCell)
          break
        case "Delete":
        case "Backspace":
          if (selectedCell) {
            updateCell(selectedCell, "")
          }
          break
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            handleCellDoubleClick(selectedCell)
            setEditValue(e.key)
          }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedCell, editingCell, rows, cols, handleEditComplete, handleCellDoubleClick, updateCell])

  // Column headers
  const columnHeaders = useMemo(() => {
    return Array.from({ length: cols }, (_, i) => getColumnLabel(i))
  }, [cols])

  const selectedCellData = selectedCell ? data.cells[selectedCell] : null

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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ bold: !selectedCellData?.style?.bold })}
            className={cn(selectedCellData?.style?.bold && "bg-muted")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ italic: !selectedCellData?.style?.italic })}
            className={cn(selectedCellData?.style?.italic && "bg-muted")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ underline: !selectedCellData?.style?.underline })}
            className={cn(selectedCellData?.style?.underline && "bg-muted")}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ align: "left" })}
            className={cn(selectedCellData?.style?.align === "left" && "bg-muted")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ align: "center" })}
            className={cn(selectedCellData?.style?.align === "center" && "bg-muted")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyStyle({ align: "right" })}
            className={cn(selectedCellData?.style?.align === "right" && "bg-muted")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={`text-${color}`}
                    className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => applyStyle({ color })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={`bg-${color}`}
                    className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => applyStyle({ bgColor: color })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button variant="ghost" size="sm" onClick={copyCell}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={cutCell}>
            <Scissors className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={pasteCell} disabled={!clipboard}>
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Formula Bar */}
      <div className="border-b bg-muted/20 p-2 flex items-center gap-2">
        <div className="w-16 text-center text-sm font-medium text-muted-foreground">
          {selectedCell || "-"}
        </div>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm text-muted-foreground">fx</span>
        <Input
          value={formulaBarValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
          className="flex-1 h-7 text-sm"
          disabled={!editable || !selectedCell}
        />
      </div>

      {/* Spreadsheet Grid */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        <table className="border-collapse w-max">
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Corner cell */}
              <th className="w-10 min-w-10 h-7 bg-muted border border-border text-center text-xs font-medium sticky left-0 z-20" />
              {/* Column headers */}
              {columnHeaders.map((label, i) => (
                <th
                  key={label}
                  className="h-7 bg-muted border border-border text-center text-xs font-medium select-none"
                  style={{ width: data.colWidths[i] || DEFAULT_COL_WIDTH, minWidth: data.colWidths[i] || DEFAULT_COL_WIDTH }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => {
              const rowNum = rowIndex + 1
              return (
                <tr key={rowNum}>
                  {/* Row header */}
                  <td className="w-10 min-w-10 bg-muted border border-border text-center text-xs font-medium sticky left-0 select-none">
                    {rowNum}
                  </td>
                  {/* Cells */}
                  {columnHeaders.map((colLabel, colIndex) => {
                    const cellRef = `${colLabel}${rowNum}`
                    const cellData = data.cells[cellRef]
                    const isSelected = selectedCell === cellRef
                    const isEditing = editingCell === cellRef
                    const displayValue = getCellDisplayValue(cellRef)

                    return (
                      <ContextMenu key={cellRef}>
                        <ContextMenuTrigger asChild>
                          <td
                            className={cn(
                              "border border-border p-0 relative cursor-cell",
                              isSelected && "ring-2 ring-primary ring-inset"
                            )}
                            style={{
                              width: data.colWidths[colIndex] || DEFAULT_COL_WIDTH,
                              minWidth: data.colWidths[colIndex] || DEFAULT_COL_WIDTH,
                              height: data.rowHeights[rowNum] || DEFAULT_ROW_HEIGHT,
                              backgroundColor: cellData?.style?.bgColor,
                            }}
                            onClick={() => handleCellClick(cellRef)}
                            onDoubleClick={() => handleCellDoubleClick(cellRef)}
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleEditComplete}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditComplete()
                                  } else if (e.key === "Escape") {
                                    setEditingCell(null)
                                    setEditValue("")
                                  }
                                }}
                                className="w-full h-full px-2 text-sm border-0 outline-none bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className={cn(
                                  "w-full h-full px-2 py-1 text-sm truncate",
                                  cellData?.style?.bold && "font-bold",
                                  cellData?.style?.italic && "italic",
                                  cellData?.style?.underline && "underline"
                                )}
                                style={{
                                  color: cellData?.style?.color,
                                  textAlign: cellData?.style?.align || "left",
                                }}
                              >
                                {displayValue}
                              </div>
                            )}
                          </td>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={copyCell}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </ContextMenuItem>
                          <ContextMenuItem onClick={cutCell}>
                            <Scissors className="mr-2 h-4 w-4" />
                            Cut
                          </ContextMenuItem>
                          <ContextMenuItem onClick={pasteCell} disabled={!clipboard}>
                            <Clipboard className="mr-2 h-4 w-4" />
                            Paste
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => updateCell(cellRef, "")}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Cell
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-muted/30 px-4 py-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {selectedCell
            ? `Selected: ${selectedCell} | Value: ${getCellDisplayValue(selectedCell) || "(empty)"}`
            : "Click a cell to select"}
        </span>
        <span>
          Supported formulas: SUM, AVERAGE, COUNT, MIN, MAX
        </span>
      </div>
    </div>
  )
}
