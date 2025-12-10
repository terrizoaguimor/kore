// ============================================
// ADMIN USER DETAIL API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// GET - Get single user with memberships (Parent Tenant Only)
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
      .from("users")
      .select(`
        *,
        memberships:organization_members(
          id,
          role,
          joined_at,
          organization:organizations(id, name, slug, is_parent_tenant)
        )
      `)
      .eq("id", id)
      .single()

    if (queryError) throw queryError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update user (Parent Tenant Only)
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
    const { full_name, phone, avatar_url, settings } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (settings !== undefined) updateData.settings = settings

    const { data, error: updateError } = await sb
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user (Parent Tenant Only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params

    // Prevent self-deletion
    if (context.userId === id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    // Remove from all organizations first
    await sb.from("organization_members").delete().eq("user_id", id)

    // Delete user
    const { error: deleteError } = await sb.from("users").delete().eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
