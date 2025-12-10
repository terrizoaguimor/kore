import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get messages for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Check access
    const { data: participant } = await sb
      .from("chat_room_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single()

    // If not participant, check if public room
    if (!participant) {
      const { data: room } = await sb
        .from("chat_rooms")
        .select("type")
        .eq("id", roomId)
        .single()

      if (!room || room.type !== "public") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const before = searchParams.get("before") // cursor for pagination

    let query = sb
      .from("chat_messages")
      .select(`
        *,
        sender:users(id, email, full_name, avatar_url)
      `)
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    // Update last read
    if (participant) {
      await sb
        .from("chat_room_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id)
    }

    return NextResponse.json({
      messages: (messages || []).reverse(),
      has_more: messages?.length === limit
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Check access
    const { data: room } = await sb
      .from("chat_rooms")
      .select("id, type")
      .eq("id", roomId)
      .single()

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if participant or public room
    const { data: participant } = await sb
      .from("chat_room_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single()

    if (!participant && room.type !== "public") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // If public room and not participant, join automatically
    if (!participant && room.type === "public") {
      await sb.from("chat_room_participants").insert({
        room_id: roomId,
        user_id: user.id,
        role: "member"
      })
    }

    const body = await request.json()
    const { content, message_type = "text", file_id, reply_to_id } = body

    if (!content && !file_id) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

    // Create message
    const { data: message, error: messageError } = await sb
      .from("chat_messages")
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type,
        file_id,
        reply_to_id,
      })
      .select(`
        *,
        sender:users(id, email, full_name, avatar_url)
      `)
      .single()

    if (messageError) throw messageError

    // Update room's last_message_at
    await sb
      .from("chat_rooms")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", roomId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
