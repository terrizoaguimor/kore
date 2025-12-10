// ============================================
// SECURITY BLOCKED IPS API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

export async function GET(request: NextRequest) {
  try {
    // Only parent tenant admins can access blocked IPs
    const { isValid, isParentTenantAdmin, error } = await getParentTenantContext()

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
    const organizationId = searchParams.get("organization_id") // Optional filter

    // Global access - get all blocked IPs
    let query = sb
      .from("security_blocked_ips")
      .select("*, organizations(name, slug)")
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("blocked_at", { ascending: false })

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    const { data, error: queryError } = await query

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
    // Only parent tenant admins can block IPs
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
    const { ip_address, reason, expires_in_hours, organization_id } = body

    if (!ip_address || !reason) {
      return NextResponse.json(
        { error: "IP address and reason are required" },
        { status: 400 }
      )
    }

    // Block IP - can specify organization or leave null for global block
    const { error: blockError } = await sb.rpc("block_ip", {
      p_ip_address: ip_address,
      p_reason: reason,
      p_expires_in_hours: expires_in_hours || null,
      p_blocked_by: context.userId,
      p_organization_id: organization_id || null, // null = global block
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
    // Only parent tenant admins can unblock IPs
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

    const { searchParams } = new URL(request.url)
    const ip_address = searchParams.get("ip")

    if (!ip_address) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Unblock IP globally
    const { data, error: unblockError } = await sb.rpc("unblock_ip", {
      p_ip_address: ip_address,
      p_unblocked_by: context.userId,
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
