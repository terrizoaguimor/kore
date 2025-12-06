"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/database"

interface TaskCardProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onEdit: (task: Task) => void
  isDragging?: boolean
}

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onEdit,
  isDragging = false,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"

  const handleStatusToggle = async () => {
    const newStatus = task.status === "done" ? "todo" : "done"
    await onUpdate(task.id, { status: newStatus })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        isSortableDragging && "ring-2 ring-primary",
        task.status === "done" && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={handleStatusToggle}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "text-sm font-medium break-words",
                  task.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Priority Badge */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs text-white",
                  priorityColors[task.priority]
                )}
              >
                {priorityLabels[task.priority]}
              </Badge>

              {/* Due Date */}
              {task.due_date && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-500" : "text-muted-foreground"
                  )}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  {format(new Date(task.due_date), "MMM d")}
                </div>
              )}

              {/* Labels */}
              {Array.isArray(task.labels) && task.labels.length > 0 && (
                <div className="flex gap-1">
                  {(task.labels as string[]).slice(0, 2).map((label, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                  {(task.labels as string[]).length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{(task.labels as string[]).length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
