import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List chat rooms for current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get rooms where user is a participant
    const { data: participantData } = await sb
      .from("chat_room_participants")
      .select("room_id")
      .eq("user_id", user.id)

    const roomIds = participantData?.map((p: { room_id: string }) => p.room_id) || []

    // Get user's organization
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    const orgId = membership?.organization_id

    // Build query
    let query = sb
      .from("chat_rooms")
      .select(`
        *,
        participants:chat_room_participants(
          *,
          user:users(id, email, full_name, avatar_url)
        )
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (roomIds.length > 0 && orgId) {
      query = query.or(`id.in.(${roomIds.join(",")}),and(organization_id.eq.${orgId},type.eq.public)`)
    } else if (orgId) {
      query = query.eq("organization_id", orgId).eq("type", "public")
    }

    const { data: rooms, error } = await query

    if (error) throw error

    // Get last message for each room
    const roomsWithLastMessage = await Promise.all(
      (rooms || []).map(async (room: { id: string }) => {
        const { data: lastMessage } = await sb
          .from("chat_messages")
          .select(`
            content,
            created_at,
            sender:users(id, full_name, avatar_url)
          `)
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        return {
          ...room,
          last_message: lastMessage || undefined,
        }
      })
    )

    return NextResponse.json({ rooms: roomsWithLastMessage })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new chat room
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, participant_ids, organization_id } = body

    if (!type || !["direct", "group", "public", "channel"].includes(type)) {
      return NextResponse.json({ error: "Invalid room type" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // For direct messages, check if room already exists
    if (type === "direct" && participant_ids?.length === 1) {
      const otherUserId = participant_ids[0]

      // Find existing direct room between these users
      const { data: existingRooms } = await sb
        .from("chat_rooms")
        .select(`
          id,
          participants:chat_room_participants(user_id)
        `)
        .eq("type", "direct")

      const existingRoom = existingRooms?.find((room: { participants: { user_id: string }[] }) => {
        const participantIds = room.participants.map((p) => p.user_id)
        return participantIds.includes(user.id) && participantIds.includes(otherUserId)
      })

      if (existingRoom) {
        return NextResponse.json({ room: { id: existingRoom.id }, existed: true })
      }
    }

    // Create the room
    const { data: room, error: roomError } = await sb
      .from("chat_rooms")
      .insert({
        name: name || null,
        type,
        organization_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add creator as participant
    const participants = [
      { room_id: room.id, user_id: user.id, role: "owner" }
    ]

    // Add other participants
    if (participant_ids?.length > 0) {
      for (const participantId of participant_ids) {
        if (participantId !== user.id) {
          participants.push({ room_id: room.id, user_id: participantId, role: "member" })
        }
      }
    }

    const { error: participantError } = await sb
      .from("chat_room_participants")
      .insert(participants)

    if (participantError) throw participantError

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
