import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { NotificationPayload } from "@/types/notifications"

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unread") === "true"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error, count } = await query

    if (error) throw error

    const unreadCount = unreadOnly ? count :
      await getUnreadCount(supabase, user.id)

    return NextResponse.json({
      notifications,
      total: count,
      unreadCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: NotificationPayload = await request.json()
    const { user_id, type, title, message, link, data } = body

    if (!user_id || !type || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notification, error } = await (supabase as any)
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message: message || null,
        link: link || null,
        data: data || {},
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, markAll } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    if (markAll) {
      // Mark all as read
      const { error } = await sb
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Missing notification ids" }, { status: 400 })
    }

    // Mark specific notifications as read
    const { error } = await sb
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .in("id", ids)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get unread count
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUnreadCount(supabase: any, userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  return count || 0
}
