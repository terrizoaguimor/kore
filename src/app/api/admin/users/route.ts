// ============================================
// ADMIN USERS API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// GET - List all users (Parent Tenant Only)
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

    // Global access - list all users with their memberships
    const { data, error: queryError } = await sb
      .from("users")
      .select(`
        *,
        memberships:organization_members(
          id,
          role,
          organization:organizations(id, name, slug, is_parent_tenant)
        )
      `)
      .order("created_at", { ascending: false })

    if (queryError) throw queryError

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
