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

// GET - List all organizations
export async function GET() {
  try {
    const supabase = await createClient()

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, storage_quota } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if slug is unique
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    // Create organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error: orgError } = await (supabase as any)
      .from("organizations")
      .insert({
        name,
        slug,
        storage_quota: storage_quota || 5368709120, // 5GB default
        storage_used: 0,
        settings: {},
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Add creator as owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "owner",
      })

    return NextResponse.json({ data: org })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
