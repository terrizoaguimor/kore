import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List events (with optional date range filter)
export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const calendarId = searchParams.get("calendar_id")

    // First get calendars in the organization
    const { data: calendars } = await sb
      .from("calendars")
      .select("id")
      .eq("organization_id", membership.organization_id)

    const calendarIds = calendars?.map((c: { id: string }) => c.id) || []

    if (calendarIds.length === 0) {
      return NextResponse.json({ events: [] })
    }

    // Build events query
    let query = sb
      .from("calendar_events")
      .select(`
        *,
        calendar:calendars(id, name, color)
      `)
      .in("calendar_id", calendarId ? [calendarId] : calendarIds)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })

    if (start) {
      query = query.gte("end_time", start)
    }
    if (end) {
      query = query.lte("start_time", end)
    }

    const { data: events, error } = await query

    if (error) throw error

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      calendar_id,
      title,
      description,
      location,
      start_time,
      end_time,
      all_day = false,
      recurrence_rule,
      reminders,
      visibility = "default",
      busy_status = "busy",
    } = body

    if (!calendar_id || !title || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error } = await (supabase as any)
      .from("calendar_events")
      .insert({
        calendar_id,
        title,
        description,
        location,
        start_time,
        end_time,
        all_day,
        recurrence_rule,
        reminders: reminders || [],
        visibility,
        busy_status,
        status: "confirmed",
        created_by: user.id,
      })
      .select(`
        *,
        calendar:calendars(id, name, color)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
