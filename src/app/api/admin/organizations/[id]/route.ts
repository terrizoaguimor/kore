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

// GET - Get single organization with stats
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
    const sb = supabase as any

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

// PUT - Update organization
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
    const { name, slug, storage_quota, settings, logo_url } = body

    // Check if slug is unique (if changing)
    if (slug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete organization
export async function DELETE(
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
    const { error } = await (supabase as any)
      .from("organizations")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
