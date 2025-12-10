// ============================================
// PLANNING PLANS API ROUTE
// With Tenant Isolation
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

// ============================================
// GET - List Plans (Tenant Isolated)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      )
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const status = searchParams.get("status")

    let query = sb
      .from("action_plans")
      .select(`
        *,
        created_by:users!action_plans_created_by_fkey(id, full_name, email),
        tasks:planning_tasks(id, status)
      `)
      .eq("organization_id", context.organizationId)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false })

    if (year) {
      query = query.eq("year", parseInt(year))
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: plans, error: queryError } = await query as { data: any[] | null, error: any }

    if (queryError) {
      console.error("[Planning API] Error fetching plans:", queryError)
      return NextResponse.json(
        { success: false, error: queryError.message },
        { status: 500 }
      )
    }

    // Calculate stats for each plan
    const plansWithStats = plans?.map(plan => {
      const tasks = plan.tasks || []
      const taskCount = tasks.length
      const completedTaskCount = tasks.filter((t: any) => t.status === 'COMPLETED').length
      const overallProgress = taskCount > 0
        ? Math.round((completedTaskCount / taskCount) * 100)
        : 0

      return {
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
        createdAt: plan.created_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: plansWithStats
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
// POST - Create Plan (Tenant Isolated)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      )
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()

    const { data: plan, error: insertError } = await sb
      .from("action_plans")
      .insert({
        name: body.name,
        description: body.description || null,
        year: body.year || new Date().getFullYear(),
        status: body.status || 'DRAFT',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        organization_id: context.organizationId,
        created_by: context.userId
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Planning API] Error creating plan:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        year: plan.year,
        status: plan.status,
        startDate: plan.start_date,
        endDate: plan.end_date
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
