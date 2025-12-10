// ============================================
// ADMIN ORGANIZATION DETAIL API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// GET - Get single organization with stats (Parent Tenant Only)
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

    const [{ data: org, error: orgError }, { count: memberCount }, { count: fileCount }] = await Promise.all([
      sb.from("organizations").select("*").eq("id", id).single(),
      sb.from("organization_members").select("*", { count: "exact", head: true }).eq("organization_id", id),
      sb.from("files").select("*", { count: "exact", head: true }).eq("organization_id", id).eq("type", "file"),
    ])

    if (orgError) throw orgError

    return NextResponse.json({
      data: {
        ...org,
        member_count: memberCount || 0,
        file_count: fileCount || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update organization (Parent Tenant Only)
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
    const { name, slug, storage_quota, settings, logo_url, is_parent_tenant } = body

    // Check if slug is unique (if changing)
    if (slug) {
      const { data: existing } = await sb
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .single()

      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (storage_quota !== undefined) updateData.storage_quota = storage_quota
    if (settings !== undefined) updateData.settings = settings
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (is_parent_tenant !== undefined) updateData.is_parent_tenant = is_parent_tenant

    const { data, error: updateError } = await sb
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete organization (Parent Tenant Only)
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

    // Prevent deleting parent tenant organization
    const { data: org } = await sb
      .from("organizations")
      .select("is_parent_tenant")
      .eq("id", id)
      .single()

    if (org?.is_parent_tenant) {
      return NextResponse.json({ error: "Cannot delete parent tenant organization" }, { status: 400 })
    }

    // Prevent deleting own organization
    if (context.organizationId === id) {
      return NextResponse.json({ error: "Cannot delete your own organization" }, { status: 400 })
    }

    const { error: deleteError } = await sb
      .from("organizations")
      .delete()
      .eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
