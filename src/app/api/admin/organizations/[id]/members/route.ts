// ============================================
// ADMIN ORGANIZATION MEMBERS API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// GET - List members of organization (Parent Tenant Only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params

    const { data, error: queryError } = await sb
      .from("organization_members")
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq("organization_id", id)
      .order("joined_at", { ascending: false })

    if (queryError) throw queryError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Add member to organization (Parent Tenant Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params
    const body = await request.json()
    const { user_id, email, role = "member" } = body

    let targetUserId = user_id

    // If email provided, find user by email
    if (!targetUserId && email) {
      const { data: user } = await sb
        .from("users")
        .select("id")
        .eq("email", email)
        .single()

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      targetUserId = user.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID or email required" }, { status: 400 })
    }

    // Check if already a member
    const { data: existing } = await sb
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", targetUserId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Add member
    const { data, error: insertError } = await sb
      .from("organization_members")
      .insert({
        organization_id: id,
        user_id: targetUserId,
        role,
      })
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update member role (Parent Tenant Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params
    const body = await request.json()
    const { member_id, role } = body

    if (!member_id || !role) {
      return NextResponse.json({ error: "Member ID and role required" }, { status: 400 })
    }

    const { data, error: updateError } = await sb
      .from("organization_members")
      .update({ role })
      .eq("id", member_id)
      .eq("organization_id", id)
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove member from organization (Parent Tenant Only)
export async function DELETE(request: NextRequest) {
  try {
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
    const memberId = searchParams.get("member_id")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    const { error: deleteError } = await sb
      .from("organization_members")
      .delete()
      .eq("id", memberId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
