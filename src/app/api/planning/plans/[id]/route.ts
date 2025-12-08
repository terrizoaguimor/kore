// ============================================
// PLANNING PLAN DETAIL API ROUTE
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// GET - Get Plan with Tasks
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

    const { data, error } = await (supabase as any)
      .from("action_plans")
      .select(`
        *,
        created_by:users!action_plans_created_by_fkey(id, full_name, email),
        tasks:planning_tasks(
          *,
          assigned_to:users!planning_tasks_assigned_to_fkey(id, full_name, email)
        )
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error("[Planning API] Error fetching plan:", error)
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      )
    }

    const plan = data as any
    const tasks = plan.tasks || []
    const taskCount = tasks.length
    const completedTaskCount = tasks.filter((t: any) => t.status === 'COMPLETED').length
    const totalProgress = tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0)
    const overallProgress = taskCount > 0 ? Math.round(totalProgress / taskCount) : 0

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        year: plan.year,
        status: plan.status,
        startDate: plan.start_date,
        endDate: plan.end_date,
        taskCount,
        completedTaskCount,
        overallProgress,
        createdBy: {
          id: plan.created_by?.id,
          name: plan.created_by?.full_name || 'Unknown',
          email: plan.created_by?.email
        },
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          notes: t.notes,
          priority: t.priority,
          status: t.status,
          category: t.category,
          startDate: t.start_date,
          dueDate: t.due_date,
          progress: t.progress || 0,
          assignedToId: t.assigned_to_id,
          assignedTo: t.assigned_to ? {
            id: t.assigned_to.id,
            name: t.assigned_to.full_name,
            email: t.assigned_to.email
          } : null
        }))
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
// PATCH - Update Plan
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

    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.year !== undefined) updateData.year = body.year
    if (body.status !== undefined) updateData.status = body.status
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate

    const { data: plan, error } = await (supabase as any)
      .from("action_plans")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Planning API] Error updating plan:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: plan
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
// DELETE - Delete Plan
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

    // Delete all tasks first
    await (supabase as any)
      .from("planning_tasks")
      .delete()
      .eq("action_plan_id", id)

    // Delete the plan
    const { error } = await (supabase as any)
      .from("action_plans")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Planning API] Error deleting plan:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted"
    })
  } catch (error: any) {
    console.error("[Planning API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
