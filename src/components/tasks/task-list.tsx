"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, MoreHorizontal, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskCard } from "./task-card"
import { cn } from "@/lib/utils"
import type { Task, TaskList as TaskListType } from "@/types/database"

interface TaskListProps {
  list: TaskListType
  tasks: Task[]
  onAddTask: (listId: string, title: string) => Promise<void>
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateList: (listId: string, name: string) => Promise<void>
  onDeleteList: (listId: string) => Promise<void>
  onEditTask: (task: Task) => void
}

export function TaskList({
  list,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateList,
  onDeleteList,
  onEditTask,
}: TaskListProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.name)

  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
  })

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    await onAddTask(list.id, newTaskTitle.trim())
    setNewTaskTitle("")
    setIsAddingTask(false)
  }

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim() || editedTitle === list.name) {
      setEditedTitle(list.name)
      setIsEditingTitle(false)
      return
    }
    await onUpdateList(list.id, editedTitle.trim())
    setIsEditingTitle(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg bg-muted/50",
        isOver && "ring-2 ring-primary"
      )}
    >
      {/* List Header */}
      <div className="flex items-center justify-between p-3">
        {isEditingTitle ? (
          <Input
            autoFocus
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateTitle()
              if (e.key === "Escape") {
                setEditedTitle(list.name)
                setIsEditingTitle(false)
              }
            }}
            className="h-7 font-semibold"
          />
        ) : (
          <h3
            className="font-semibold cursor-pointer hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
          >
            {list.name}
          </h3>
        )}

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {tasks.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteList(list.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 px-3">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pb-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>

      {/* Add Task */}
      <div className="p-3 pt-0">
        {isAddingTask ? (
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask()
                if (e.key === "Escape") setIsAddingTask(false)
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddTask}>
                Add Task
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingTask(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  )
}
