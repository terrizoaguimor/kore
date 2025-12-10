// ============================================
// ADMIN ORGANIZATIONS API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// GET - List all organizations (Parent Tenant Only)
export async function GET() {
  try {
    // Only parent tenant admins can access admin panel
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

    // Global access - list all organizations
    const { data, error: queryError } = await sb
      .from("organizations")
      .select(`
        *,
        members:organization_members(count)
      `)
      .order("created_at", { ascending: false })

    if (queryError) throw queryError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new organization (Parent Tenant Only)
export async function POST(request: NextRequest) {
  try {
    // Only parent tenant admins can create organizations
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
    const { name, slug, storage_quota, is_parent_tenant } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if slug is unique
    const { data: existing } = await sb
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    // Create organization
    const { data: org, error: orgError } = await sb
      .from("organizations")
      .insert({
        name,
        slug,
        storage_quota: storage_quota || 5368709120, // 5GB default
        storage_used: 0,
        settings: {},
        is_parent_tenant: is_parent_tenant || false,
      })
      .select()
      .single()

    if (orgError) throw orgError

    return NextResponse.json({ data: org })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
