// ============================================
// MEET ROOM API ROUTE
// Multi-tenant isolated room operations
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

// Helper to verify room belongs to user's organization
async function verifyRoomAccess(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  roomId: string
): Promise<{ hasAccess: boolean; room?: Record<string, unknown>; organizationId?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Get user's organization
  const { data: membership } = await sb
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single()

  if (!membership?.organization_id) {
    return { hasAccess: false }
  }

  // Check if room belongs to user's organization
  const { data: room } = await sb
    .from("video_rooms")
    .select("*")
    .eq("room_id", roomId)
    .eq("organization_id", membership.organization_id)
    .single()

  if (!room) {
    return { hasAccess: false }
  }

  return { hasAccess: true, room, organizationId: membership.organization_id }
}

// ============================================
// GET - Get Room Details
// ============================================
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { roomId } = await params

    // Verify room belongs to user's organization
    const { hasAccess, room } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get additional room data with sessions and participants
    const { data: roomWithDetails } = await sb
      .from("video_rooms")
      .select(`
        *,
        created_by_user:users!video_rooms_created_by_fkey(id, email, full_name, avatar_url),
        sessions:video_sessions(
          *,
          participants:video_participants(*)
        )
      `)
      .eq("room_id", roomId)
      .single()

    // Get current presence in the room
    const { data: presence } = await sb
      .from("meeting_presence")
      .select("*")
      .eq("room_id", roomId)
      .in("status", ["waiting", "in_meeting"])

    return NextResponse.json({
      success: true,
      data: {
        ...roomWithDetails,
        currentPresence: presence || [],
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error getting room:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Room Actions (generateToken, refreshToken, presence)
// ============================================
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { roomId } = await params

    // Verify room belongs to user's organization
    const { hasAccess, organizationId } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const { action, ...actionParams } = body

    let result

    switch (action) {
      case "generateToken":
        // Generate token with user context for tracking
        result = await TelnyxVideo.generateToken(roomId, {
          tokenTtl: actionParams.token_ttl_secs || 600,
          refreshTokenTtl: actionParams.refresh_token_ttl_secs || 3600,
        })

        // If successful, add/update presence
        if (result.success) {
          await sb
            .from("meeting_presence")
            .upsert({
              room_id: roomId,
              user_id: user.id,
              display_name: actionParams.display_name || user.email?.split("@")[0] || "Guest",
              status: "waiting",
              last_seen_at: new Date().toISOString(),
              metadata: {
                email: user.email,
                organization_id: organizationId,
              },
            }, {
              onConflict: "room_id,user_id",
            })
        }
        break

      case "refreshToken":
        if (!actionParams.refresh_token) {
          return NextResponse.json(
            { success: false, error: "Missing refresh_token" },
            { status: 400 }
          )
        }
        result = await TelnyxVideo.refreshToken(
          roomId,
          actionParams.refresh_token,
          actionParams.token_ttl
        )

        // Update presence last seen
        if (result.success) {
          await sb
            .from("meeting_presence")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("room_id", roomId)
            .eq("user_id", user.id)
        }
        break

      case "joinMeeting":
        // Update presence to in_meeting
        await sb
          .from("meeting_presence")
          .upsert({
            room_id: roomId,
            user_id: user.id,
            display_name: actionParams.display_name || user.email?.split("@")[0] || "Guest",
            status: "in_meeting",
            joined_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            metadata: {
              email: user.email,
              organization_id: organizationId,
            },
          }, {
            onConflict: "room_id,user_id",
          })

        result = { success: true, data: { status: "joined" } }
        break

      case "leaveMeeting":
        // Update presence to disconnected
        await sb
          .from("meeting_presence")
          .update({
            status: "disconnected",
            last_seen_at: new Date().toISOString(),
          })
          .eq("room_id", roomId)
          .eq("user_id", user.id)

        result = { success: true, data: { status: "left" } }
        break

      case "heartbeat":
        // Update last_seen for presence tracking
        await sb
          .from("meeting_presence")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("room_id", roomId)
          .eq("user_id", user.id)

        result = { success: true, data: { status: "ok" } }
        break

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error executing room action:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Update Room
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { roomId } = await params

    // Verify room belongs to user's organization
    const { hasAccess } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Update via Telnyx
    const result = await TelnyxVideo.updateRoom(roomId, {
      uniqueName: body.unique_name,
      maxParticipants: body.max_participants,
      enableRecording: body.enable_recording,
      webhookUrl: body.webhook_event_url,
    })

    // Also update local DB
    if (result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      await sb
        .from("video_rooms")
        .update({
          unique_name: body.unique_name,
          max_participants: body.max_participants,
          enable_recording: body.enable_recording,
          updated_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error updating room:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete Room
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { roomId } = await params

    // Verify room belongs to user's organization
    const { hasAccess } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    // Delete via Telnyx
    const result = await TelnyxVideo.deleteRoom(roomId)

    // Soft delete in local DB
    if (result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      await sb
        .from("video_rooms")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("room_id", roomId)

      // Clean up presence
      await sb
        .from("meeting_presence")
        .delete()
        .eq("room_id", roomId)
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error deleting room:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
