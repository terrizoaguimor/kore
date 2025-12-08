// ============================================
// PLANNING PLANS API ROUTE
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================
// GET - List Plans
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: membershipData } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    const membership = membershipData as { organization_id: string } | null

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const status = searchParams.get("status")

    let query = (supabase as any)
      .from("action_plans")
      .select(`
        *,
        created_by:users!action_plans_created_by_fkey(id, full_name, email),
        tasks:planning_tasks(id, status)
      `)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false })

    if (membership?.organization_id) {
      query = query.eq("organization_id", membership.organization_id)
    }

    if (year) {
      query = query.eq("year", parseInt(year))
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: plans, error } = await query as { data: any[] | null, error: any }

    if (error) {
      console.error("[Planning API] Error fetching plans:", error)
      return NextResponse.json(
        { success: false, error: error.message },
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
// POST - Create Plan
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: membershipData } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    const membership = membershipData as { organization_id: string } | null
    const body = await request.json()

    const { data: plan, error } = await (supabase as any)
      .from("action_plans")
      .insert({
        name: body.name,
        description: body.description || null,
        year: body.year || new Date().getFullYear(),
        status: body.status || 'DRAFT',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        organization_id: membership?.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("[Planning API] Error creating plan:", error)
      return NextResponse.json(
        { success: false, error: error.message },
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
