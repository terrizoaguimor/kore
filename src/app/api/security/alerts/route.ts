// ============================================
// SECURITY ALERTS API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

export async function GET(request: NextRequest) {
  try {
    // Only parent tenant admins can access security alerts
    const { isValid, isParentTenantAdmin, context, error } = await getParentTenantContext()

    if (!isValid || !isParentTenantAdmin) {
      return NextResponse.json(
        { error: error || "Access denied - This feature is only available to system administrators" },
        { status: 403 }
      )
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
    const organizationId = searchParams.get("organization_id") // Optional filter

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Global access - no org filter by default
    let query = sb
      .from("security_alerts")
      .select("*, organizations(name, slug)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

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
    // Only parent tenant admins can manage security alerts
    const { isValid, isParentTenantAdmin, context, error } = await getParentTenantContext()

    if (!isValid || !isParentTenantAdmin || !context) {
      return NextResponse.json(
        { error: error || "Access denied - This feature is only available to system administrators" },
        { status: 403 }
      )
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

    // Global access - can update any alert
    const { error: updateError } = await sb
      .from("security_alerts")
      .update({
        is_resolved,
        resolved_at: is_resolved ? new Date().toISOString() : null,
        resolved_by: is_resolved ? context.userId : null,
      })
      .eq("id", id)

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
