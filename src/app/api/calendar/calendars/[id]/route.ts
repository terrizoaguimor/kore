import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get calendar details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: calendar, error } = await (supabase as any)
      .from("calendars")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !calendar) {
      return NextResponse.json({ error: "Calendar not found" }, { status: 404 })
    }

    return NextResponse.json({ calendar })
  } catch (error) {
    console.error("Error fetching calendar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update calendar
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, description, timezone } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (color !== undefined) updateData.color = color
    if (description !== undefined) updateData.description = description
    if (timezone !== undefined) updateData.timezone = timezone

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: calendar, error } = await (supabase as any)
      .from("calendars")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ calendar })
  } catch (error) {
    console.error("Error updating calendar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete calendar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Check if it's the default calendar
    const { data: calendar } = await sb
      .from("calendars")
      .select("is_default")
      .eq("id", id)
      .single()

    if (calendar?.is_default) {
      return NextResponse.json({ error: "Cannot delete default calendar" }, { status: 400 })
    }

    // Delete all events first
    await sb.from("calendar_events").delete().eq("calendar_id", id)

    // Delete calendar
    const { error } = await sb.from("calendars").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting calendar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
