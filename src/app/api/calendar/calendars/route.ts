import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List calendars for user's organization
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    const { data: calendars, error } = await sb
      .from("calendars")
      .select("*")
      .eq("organization_id", membership.organization_id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({ calendars })
  } catch (error) {
    console.error("Error fetching calendars:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new calendar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, color = "#2f62ea", description, timezone = "UTC" } = body

    if (!name) {
      return NextResponse.json({ error: "Calendar name required" }, { status: 400 })
    }

    const { data: calendar, error } = await sb
      .from("calendars")
      .insert({
        organization_id: membership.organization_id,
        owner_id: user.id,
        name,
        color,
        description,
        timezone,
        is_default: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ calendar })
  } catch (error) {
    console.error("Error creating calendar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
