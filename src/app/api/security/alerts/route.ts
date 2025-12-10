import { NextRequest, NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

export async function GET(request: NextRequest) {
  try {
    // Get tenant context with admin validation
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (!context.isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get("hours") || "24")
    const limit = parseInt(searchParams.get("limit") || "50")
    const severity = searchParams.get("severity")
    const unresolved = searchParams.get("unresolved") === "true"

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    let query = sb
      .from("security_alerts")
      .select("*")
      .eq("organization_id", context.organizationId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq("severity", severity)
    }

    if (unresolved) {
      query = query.eq("is_resolved", false)
    }

    const { data, error: queryError } = await query

    if (queryError) throw queryError

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("Error getting alerts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get tenant context with admin validation
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (!context.isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const { id, is_resolved } = body

    if (!id) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      )
    }

    // Update alert filtered by organization
    const { error: updateError } = await sb
      .from("security_alerts")
      .update({
        is_resolved,
        resolved_at: is_resolved ? new Date().toISOString() : null,
        resolved_by: is_resolved ? context.userId : null,
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating alert:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
