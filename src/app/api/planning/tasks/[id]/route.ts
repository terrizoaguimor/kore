// ============================================
// PLANNING TASK API ROUTE
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// GET - Get Task
// ============================================
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: task, error } = await (supabase as any)
      .from("planning_tasks")
      .select(`
        *,
        assigned_to:users!planning_tasks_assigned_to_fkey(id, full_name, email),
        action_plan:action_plans(id, name, year)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        notes: task.notes,
        priority: task.priority,
        status: task.status,
        category: task.category,
        startDate: task.start_date,
        dueDate: task.due_date,
        progress: task.progress,
        assignedToId: task.assigned_to_id,
        assignedTo: task.assigned_to ? {
          id: task.assigned_to.id,
          name: task.assigned_to.full_name,
          email: task.assigned_to.email
        } : null,
        actionPlan: task.action_plan ? {
          id: task.action_plan.id,
          name: task.action_plan.name,
          year: task.action_plan.year
        } : null
      }
    })
  } catch (error: any) {
    console.error("[Planning API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Update Task
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.category !== undefined) updateData.category = body.category
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.assignedToId !== undefined) updateData.assigned_to_id = body.assignedToId

    // Auto-complete if progress is 100
    if (body.progress === 100 && !body.status) {
      updateData.status = 'COMPLETED'
    }

    // Auto-set progress if completed
    if (body.status === 'COMPLETED' && body.progress === undefined) {
      updateData.progress = 100
    }

    const { data: task, error } = await (supabase as any)
      .from("planning_tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Planning API] Error updating task:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        category: task.category,
        startDate: task.start_date,
        dueDate: task.due_date,
        progress: task.progress
      }
    })
  } catch (error: any) {
    console.error("[Planning API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete Task
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Delete subtasks first
    await (supabase as any)
      .from("planning_tasks")
      .delete()
      .eq("parent_task_id", id)

    // Delete the task
    const { error } = await (supabase as any)
      .from("planning_tasks")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Planning API] Error deleting task:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted"
    })
  } catch (error: any) {
    console.error("[Planning API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
