// ============================================
// ADMIN REMOVE MEMBER API ROUTE
// Parent Tenant Only - Global Access
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getParentTenantContext } from "@/lib/tenant"

// DELETE - Remove member from organization by member ID (Parent Tenant Only)
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
