import { NextRequest, NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

export async function GET() {
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

    // Get blocked IPs filtered by organization
    const { data, error: queryError } = await sb
      .from("security_blocked_ips")
      .select("*")
      .eq("organization_id", context.organizationId)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("blocked_at", { ascending: false })

    if (queryError) throw queryError

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("Error getting blocked IPs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { ip_address, reason, expires_in_hours } = body

    if (!ip_address || !reason) {
      return NextResponse.json(
        { error: "IP address and reason are required" },
        { status: 400 }
      )
    }

    // Block IP with organization context
    const { error: blockError } = await sb.rpc("block_ip", {
      p_ip_address: ip_address,
      p_reason: reason,
      p_expires_in_hours: expires_in_hours || null,
      p_blocked_by: context.userId,
      p_organization_id: context.organizationId,
    })

    if (blockError) throw blockError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error blocking IP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const ip_address = searchParams.get("ip")

    if (!ip_address) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Unblock IP with organization context
    const { data, error: unblockError } = await sb.rpc("unblock_ip", {
      p_ip_address: ip_address,
      p_unblocked_by: context.userId,
      p_organization_id: context.organizationId,
    })

    if (unblockError) throw unblockError

    return NextResponse.json({ success: true, was_blocked: data })
  } catch (error) {
    console.error("Error unblocking IP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
