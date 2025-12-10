import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper to check room access
async function canAccessRoom(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, roomId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Check if user is participant or room is public
  const { data: room } = await sb
    .from("chat_rooms")
    .select(`
      *,
      participants:chat_room_participants(user_id, role)
    `)
    .eq("id", roomId)
    .single()

  if (!room) return null

  const isParticipant = room.participants?.some((p: { user_id: string }) => p.user_id === userId)
  const isPublic = room.type === "public"

  if (!isParticipant && !isPublic) return null

  return room
}

// GET - Get room details
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

    const room = await canAccessRoom(supabase, roomId, user.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get full participant details
    const { data: participants } = await sb
      .from("chat_room_participants")
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq("room_id", roomId)

    return NextResponse.json({
      room: {
        ...room,
        participants: participants || []
      }
    })
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update room settings
export async function PATCH(
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

    const room = await canAccessRoom(supabase, roomId, user.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 })
    }

    // Check if user is owner/moderator
    const userRole = room.participants?.find((p: { user_id: string }) => p.user_id === user.id)?.role
    if (!["owner", "moderator"].includes(userRole)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, avatar_url } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("chat_rooms")
      .update({ name, description, avatar_url })
      .eq("id", roomId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ room: data })
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Leave or delete room
export async function DELETE(
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

    const room = await canAccessRoom(supabase, roomId, user.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const userRole = room.participants?.find((p: { user_id: string }) => p.user_id === user.id)?.role

    if (userRole === "owner") {
      // Delete the entire room if owner
      await sb.from("chat_messages").delete().eq("room_id", roomId)
      await sb.from("chat_room_participants").delete().eq("room_id", roomId)
      await sb.from("chat_rooms").delete().eq("id", roomId)
      return NextResponse.json({ deleted: true })
    } else {
      // Just leave the room
      await sb
        .from("chat_room_participants")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id)
      return NextResponse.json({ left: true })
    }
  } catch (error) {
    console.error("Error deleting/leaving room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
