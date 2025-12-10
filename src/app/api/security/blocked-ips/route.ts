import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get blocked IPs
    const { data, error } = await supabase
      .from("security_blocked_ips")
      .select("*")
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("blocked_at", { ascending: false })

    if (error) throw error

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
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { ip_address, reason, expires_in_hours } = body

    if (!ip_address || !reason) {
      return NextResponse.json(
        { error: "IP address and reason are required" },
        { status: 400 }
      )
    }

    // Use Supabase function to block IP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("block_ip", {
      p_ip_address: ip_address,
      p_reason: reason,
      p_expires_in_hours: expires_in_hours || null,
      p_blocked_by: user.email || "admin",
    })

    if (error) throw error

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
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const ip_address = searchParams.get("ip")

    if (!ip_address) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Use Supabase function to unblock IP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("unblock_ip", {
      p_ip_address: ip_address,
      p_unblocked_by: user.email || "admin",
    })

    if (error) throw error

    return NextResponse.json({ success: true, was_blocked: data })
  } catch (error) {
    console.error("Error unblocking IP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
