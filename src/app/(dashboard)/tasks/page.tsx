"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Layout, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { TaskBoard } from "@/components/tasks/task-board"
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog"
import { NewBoardDialog } from "@/components/tasks/new-board-dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import type { Task, TaskBoard as TaskBoardType, TaskList as TaskListType } from "@/types/database"

export default function TasksPage() {
  const { user, organization } = useAuthStore()
  const [boards, setBoards] = useState<TaskBoardType[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [lists, setLists] = useState<TaskListType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    if (!organization) return

    try {
      const { data, error } = await supabase
        .from("task_boards")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setBoards(data || [])

      // Select first board if none selected
      if (!selectedBoardId && data && data.length > 0) {
        setSelectedBoardId(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
    } finally {
      setIsLoading(false)
    }
  }, [organization, supabase, selectedBoardId])

  // Fetch lists and tasks for selected board
  const fetchBoardData = useCallback(async () => {
    if (!selectedBoardId) return

    try {
      // Fetch lists
      const { data: listsData, error: listsError } = await supabase
        .from("task_lists")
        .select("*")
        .eq("board_id", selectedBoardId)
        .order("position", { ascending: true })

      if (listsError) throw listsError
      setLists(listsData || [])

      // Fetch tasks for all lists
      if (listsData && listsData.length > 0) {
        const listIds = listsData.map((l: TaskListType) => l.id)
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .in("list_id", listIds)
          .order("position", { ascending: true })

        if (tasksError) throw tasksError
        setTasks(tasksData || [])
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error("Error fetching board data:", error)
    }
  }, [selectedBoardId, supabase])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  useEffect(() => {
    fetchBoardData()
  }, [fetchBoardData])

  // Create board
  const handleCreateBoard = async (name: string, color: string) => {
    if (!organization || !user) return

    try {
      const { data, error } = await supabase
        .from("task_boards")
        .insert({
          organization_id: organization.id,
          name,
          color,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setBoards((prev) => [...prev, data])
      setSelectedBoardId(data.id)
      toast.success("Board created")
    } catch (error) {
      console.error("Error creating board:", error)
      toast.error("Failed to create board")
    }
  }

  // Delete board
  const handleDeleteBoard = async (boardId: string) => {
    try {
      const { error } = await supabase
        .from("task_boards")
        .delete()
        .eq("id", boardId)

      if (error) throw error

      setBoards((prev) => prev.filter((b) => b.id !== boardId))
      if (selectedBoardId === boardId) {
        setSelectedBoardId(boards.find((b) => b.id !== boardId)?.id || null)
      }
      toast.success("Board deleted")
    } catch (error) {
      console.error("Error deleting board:", error)
      toast.error("Failed to delete board")
    }
  }

  // Add list
  const handleAddList = async (name: string) => {
    if (!selectedBoardId) return

    try {
      const { data, error } = await supabase
        .from("task_lists")
        .insert({
          board_id: selectedBoardId,
          name,
          position: lists.length,
        })
        .select()
        .single()

      if (error) throw error
      setLists((prev) => [...prev, data])
    } catch (error) {
      console.error("Error adding list:", error)
      toast.error("Failed to add list")
    }
  }

  // Update list
  const handleUpdateList = async (listId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("task_lists")
        .update({ name })
        .eq("id", listId)

      if (error) throw error
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, name } : l))
      )
    } catch (error) {
      console.error("Error updating list:", error)
      toast.error("Failed to update list")
    }
  }

  // Delete list
  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from("task_lists")
        .delete()
        .eq("id", listId)

      if (error) throw error
      setLists((prev) => prev.filter((l) => l.id !== listId))
      setTasks((prev) => prev.filter((t) => t.list_id !== listId))
      toast.success("List deleted")
    } catch (error) {
      console.error("Error deleting list:", error)
      toast.error("Failed to delete list")
    }
  }

  // Add task
  const handleAddTask = async (listId: string, title: string) => {
    if (!user) return

    try {
      const tasksInList = tasks.filter((t) => t.list_id === listId)
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          list_id: listId,
          title,
          position: tasksInList.length,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      setTasks((prev) => [...prev, data])
    } catch (error) {
      console.error("Error adding task:", error)
      toast.error("Failed to add task")
    }
  }

  // Update task
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)

      if (error) throw error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      )
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task")
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)

      if (error) throw error
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success("Task deleted")
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  // Move task
  const handleMoveTask = async (
    taskId: string,
    newListId: string,
    newPosition: number
  ) => {
    try {
      // Update positions of other tasks
      const { error } = await supabase
        .from("tasks")
        .update({ list_id: newListId, position: newPosition })
        .eq("id", taskId)

      if (error) throw error

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, list_id: newListId, position: newPosition } : t
        )
      )
    } catch (error) {
      console.error("Error moving task:", error)
      toast.error("Failed to move task")
    }
  }

  const selectedBoard = boards.find((b) => b.id === selectedBoardId)

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please log in to access Tasks</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Tasks</h1>

          {boards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedBoard?.color }}
                  />
                  {selectedBoard?.name || "Select Board"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {boards.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => setSelectedBoardId(board.id)}
                    className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: board.color }}
                      />
                      {board.name}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBoard(board.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsNewBoardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Button onClick={() => setIsNewBoardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {boards.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Layout className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No boards yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create a board to start organizing your tasks
              </p>
              <Button onClick={() => setIsNewBoardOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </div>
          </div>
        ) : selectedBoard ? (
          <TaskBoard
            board={selectedBoard}
            lists={lists}
            tasks={tasks}
            onAddList={handleAddList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
            onEditTask={setEditingTask}
          />
        ) : null}
      </div>

      <NewBoardDialog
        open={isNewBoardOpen}
        onOpenChange={setIsNewBoardOpen}
        onCreateBoard={handleCreateBoard}
      />

      <TaskEditDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleUpdateTask}
      />
    </div>
  )
}
