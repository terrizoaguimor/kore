"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface CRMColumn<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface CRMDataTableProps<T extends { id: string }> {
  data: T[]
  columns: CRMColumn<T>[]
  isLoading?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onSort?: (key: string, direction: "asc" | "desc") => void
  selectedItems?: string[]
  onSelectionChange?: (ids: string[]) => void
  emptyMessage?: string
  customActions?: (item: T) => React.ReactNode
}

export function CRMDataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  searchPlaceholder = "Search...",
  onSearch,
  onView,
  onEdit,
  onDelete,
  onSort,
  selectedItems = [],
  onSelectionChange,
  emptyMessage = "No items found",
  customActions,
}: CRMDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === data.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(data.map((item) => item.id))
    }
  }

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      onSelectionChange?.(selectedItems.filter((i) => i !== id))
    } else {
      onSelectionChange?.([...selectedItems, id])
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => {
              // Simple CSV Export Logic
              if (!data.length) return

              const headers = columns.map(c => c.label).join(",")
              const rows = data.map(item =>
                columns.map(c => {
                  const val = (item as any)[c.key]
                  return `"${String(val || "").replace(/"/g, '""')}"`
                }).join(",")
              )

              const csvContent = [headers, ...rows].join("\n")
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
              const link = document.createElement("a")
              if (link.download !== undefined) {
                const url = URL.createObjectURL(blob)
                link.setAttribute("href", url)
                link.setAttribute("download", "export.csv")
                link.style.visibility = "hidden"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {onSelectionChange && (
                <TableHead className="w-12 text-muted-foreground">
                  <Checkbox
                    checked={selectedItems.length === data.length && data.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn("text-muted-foreground font-medium", column.className)}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {column.label}
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableHead className="w-12 text-muted-foreground"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {onSelectionChange && (
                    <TableCell>
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onSelectionChange ? 2 : 1)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border-border hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedItems.includes(item.id) && "bg-muted"
                  )}
                  onClick={() => onView?.(item)}
                >
                  {onSelectionChange && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                        className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={cn("text-foreground", column.className)}>
                      {column.render
                        ? column.render(item)
                        : (item as Record<string, unknown>)[column.key]?.toString() || "-"}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)} className="text-foreground hover:bg-accent">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)} className="text-foreground hover:bg-accent">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-destructive hover:bg-accent hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {customActions && customActions(item)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing <span className="text-foreground">{data.length}</span> items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-input bg-background text-muted-foreground hover:text-foreground"
              disabled
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-foreground">1</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-input bg-background text-muted-foreground hover:text-foreground"
              disabled
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility components for common CRM displays
export function CRMStatusBadge({
  status,
  variant,
}: {
  status: string
  variant?: "default" | "success" | "warning" | "danger" | "info"
}) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  }

  return (
    <Badge className={cn("border", variantClasses[variant || "default"])}>
      {status}
    </Badge>
  )
}

export function CRMRatingBadge({ rating }: { rating: "Hot" | "Warm" | "Cold" | null }) {
  const ratingConfig = {
    Hot: { class: "bg-red-500/20 text-red-400 border-red-500/30", label: "Hot" },
    Warm: { class: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Warm" },
    Cold: { class: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Cold" },
  }

  if (!rating) return null

  const config = ratingConfig[rating]
  return (
    <Badge className={cn("border", config.class)}>
      {config.label}
    </Badge>
  )
}

export function CRMDealStageBadge({ stage }: { stage: string }) {
  const stageConfig: Record<string, { class: string }> = {
    "Prospecting": { class: "bg-muted text-muted-foreground border-border" },
    "Qualification": { class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "Proposal": { class: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    "Negotiation": { class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    "Closed Won": { class: "bg-green-500/20 text-green-400 border-green-500/30" },
    "Closed Lost": { class: "bg-red-500/20 text-red-400 border-red-500/30" },
  }

  const config = stageConfig[stage] || stageConfig["Prospecting"]
  return (
    <Badge className={cn("border", config.class)}>
      {stage}
    </Badge>
  )
}

export function CRMLeadStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { class: string }> = {
    "New": { class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "Contacted": { class: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    "Qualified": { class: "bg-green-500/20 text-green-400 border-green-500/30" },
    "Unqualified": { class: "bg-muted text-muted-foreground border-border" },
    "Converted": { class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    "Lost": { class: "bg-red-500/20 text-red-400 border-red-500/30" },
  }

  const config = statusConfig[status] || statusConfig["New"]
  return (
    <Badge className={cn("border", config.class)}>
      {status}
    </Badge>
  )
}

export function CRMInvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { class: string }> = {
    "Draft": { class: "bg-muted text-muted-foreground border-border" },
    "Sent": { class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "Viewed": { class: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    "Partially Paid": { class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    "Paid": { class: "bg-green-500/20 text-green-400 border-green-500/30" },
    "Overdue": { class: "bg-red-500/20 text-red-400 border-red-500/30" },
    "Cancelled": { class: "bg-muted text-muted-foreground border-border" },
  }

  const config = statusConfig[status] || statusConfig["Draft"]
  return (
    <Badge className={cn("border", config.class)}>
      {status}
    </Badge>
  )
}
