import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE - Delete a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, shareId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the share belongs to this file and user has access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: share } = await (supabase as any)
      .from("shares")
      .select(`
        *,
        file:files(organization_id)
      `)
      .eq("id", shareId)
      .eq("file_id", id)
      .single()

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    // Check if user is member of the organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from("organization_members")
      .select("id")
      .eq("organization_id", share.file.organization_id)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete the share
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("shares")
      .delete()
      .eq("id", shareId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
