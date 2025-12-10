// ============================================
// TALK ROOMS API ROUTE
// With Tenant Isolation
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

// GET - List chat rooms for current user (Tenant Isolated)
export async function GET() {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get rooms where user is a participant
    const { data: participantData } = await sb
      .from("chat_room_participants")
      .select("room_id")
      .eq("user_id", context.userId)

    const roomIds = participantData?.map((p: { room_id: string }) => p.room_id) || []

    // Build query - filtered by organization
    let query = sb
      .from("chat_rooms")
      .select(`
        *,
        participants:chat_room_participants(
          *,
          user:users(id, email, full_name, avatar_url)
        )
      `)
      .eq("organization_id", context.organizationId)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    // User can see rooms they're in, or public rooms in their org
    if (roomIds.length > 0) {
      query = query.or(`id.in.(${roomIds.join(",")}),type.eq.public`)
    } else {
      query = query.eq("type", "public")
    }

    const { data: rooms, error: queryError } = await query

    if (queryError) throw queryError

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

// POST - Create a new chat room (Tenant Isolated)
export async function POST(request: NextRequest) {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const { name, type, participant_ids } = body

    if (!type || !["direct", "group", "public", "channel"].includes(type)) {
      return NextResponse.json({ error: "Invalid room type" }, { status: 400 })
    }

    // For direct messages, check if room already exists
    if (type === "direct" && participant_ids?.length === 1) {
      const otherUserId = participant_ids[0]

      // Verify the other user is in the same organization
      const { data: otherMembership } = await sb
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", otherUserId)
        .eq("organization_id", context.organizationId)
        .single()

      if (!otherMembership) {
        return NextResponse.json(
          { error: "Cannot create room with users outside your organization" },
          { status: 403 }
        )
      }

      // Find existing direct room between these users in this org
      const { data: existingRooms } = await sb
        .from("chat_rooms")
        .select(`
          id,
          participants:chat_room_participants(user_id)
        `)
        .eq("type", "direct")
        .eq("organization_id", context.organizationId)

      const existingRoom = existingRooms?.find((room: { participants: { user_id: string }[] }) => {
        const participantIds = room.participants.map((p) => p.user_id)
        return participantIds.includes(context.userId) && participantIds.includes(otherUserId)
      })

      if (existingRoom) {
        return NextResponse.json({ room: { id: existingRoom.id }, existed: true })
      }
    }

    // Create the room with organization context
    const { data: room, error: roomError } = await sb
      .from("chat_rooms")
      .insert({
        name: name || null,
        type,
        organization_id: context.organizationId,
        created_by: context.userId,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add creator as participant
    const participants = [
      { room_id: room.id, user_id: context.userId, role: "owner" }
    ]

    // Add other participants (verify they're in the same org)
    if (participant_ids?.length > 0) {
      for (const participantId of participant_ids) {
        if (participantId !== context.userId) {
          // Verify participant is in same org
          const { data: memberCheck } = await sb
            .from("organization_members")
            .select("id")
            .eq("user_id", participantId)
            .eq("organization_id", context.organizationId)
            .single()

          if (memberCheck) {
            participants.push({ room_id: room.id, user_id: participantId, role: "member" })
          }
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
