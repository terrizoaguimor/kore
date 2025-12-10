import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper to check if user is admin
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .single()

  return !!membership
}

// GET - List members of organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("organization_members")
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq("organization_id", id)
      .order("joined_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Add member to organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, email, role = "member" } = body

    let targetUserId = user_id

    // If email provided, find user by email
    if (!targetUserId && email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", targetUserId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Add member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
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

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { member_id, role } = body

    if (!member_id || !role) {
      return NextResponse.json({ error: "Member ID and role required" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("organization_members")
      .update({ role })
      .eq("id", member_id)
      .eq("organization_id", id)
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove member from organization
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("member_id")

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("organization_members")
      .delete()
      .eq("id", memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
