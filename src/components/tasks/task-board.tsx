"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, MoreHorizontal, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskList } from "./task-list"
import { TaskCard } from "./task-card"
import type { Task, TaskBoard as TaskBoardType, TaskList as TaskListType } from "@/types/database"

interface TaskBoardProps {
  board: TaskBoardType
  lists: TaskListType[]
  tasks: Task[]
  onAddList: (name: string) => Promise<void>
  onUpdateList: (listId: string, name: string) => Promise<void>
  onDeleteList: (listId: string) => Promise<void>
  onAddTask: (listId: string, title: string) => Promise<void>
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onMoveTask: (taskId: string, newListId: string, newPosition: number) => Promise<void>
  onEditTask: (task: Task) => void
}

export function TaskBoard({
  board,
  lists,
  tasks,
  onAddList,
  onUpdateList,
  onDeleteList,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onEditTask,
}: TaskBoardProps) {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddList = async () => {
    if (!newListName.trim()) return
    await onAddList(newListName.trim())
    setNewListName("")
    setIsAddingList(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for visual feedback
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if dropped on a list
    const overList = lists.find((l) => l.id === overId)
    if (overList) {
      // Dropped on empty list
      const tasksInList = tasks.filter((t) => t.list_id === overList.id)
      await onMoveTask(activeId, overList.id, tasksInList.length)
      return
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      const newListId = overTask.list_id
      const tasksInList = tasks
        .filter((t) => t.list_id === newListId)
        .sort((a, b) => a.position - b.position)

      const overIndex = tasksInList.findIndex((t) => t.id === overId)
      await onMoveTask(activeId, newListId, overIndex)
    }
  }

  const getTasksForList = (listId: string) => {
    return tasks
      .filter((t) => t.list_id === listId)
      .sort((a, b) => a.position - b.position)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        <SortableContext
          items={lists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {lists
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <TaskList
                key={list.id}
                list={list}
                tasks={getTasksForList(list.id)}
                onAddTask={onAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onUpdateList={onUpdateList}
                onDeleteList={onDeleteList}
                onEditTask={onEditTask}
              />
            ))}
        </SortableContext>

        {/* Add List Button */}
        <div className="w-72 shrink-0">
          {isAddingList ? (
            <div className="rounded-lg bg-muted p-3">
              <Input
                autoFocus
                placeholder="Enter list title..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddList()
                  if (e.key === "Escape") setIsAddingList(false)
                }}
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleAddList}>
                  Add List
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingList(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start bg-muted/50 hover:bg-muted"
              onClick={() => setIsAddingList(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add List
            </Button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
