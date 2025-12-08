// ============================================
// PLANNING PLAN TASKS API ROUTE
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// POST - Create Task for Plan
// ============================================
export async function POST(
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

    const { id: planId } = await params
    const body = await request.json()

    const { data: task, error } = await (supabase as any)
      .from("planning_tasks")
      .insert({
        action_plan_id: planId,
        title: body.title,
        description: body.description || null,
        notes: body.notes || null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PENDING',
        category: body.category || 'OTHER',
        start_date: body.startDate || null,
        due_date: body.dueDate || null,
        progress: body.progress || 0,
        assigned_to_id: body.assignedToId || null,
        parent_task_id: body.parentTaskId || null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("[Planning API] Error creating task:", error)
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
