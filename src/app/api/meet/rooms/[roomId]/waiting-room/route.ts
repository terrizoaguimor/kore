// ============================================
// WAITING ROOM API ROUTE
// Multi-tenant waiting room management
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

// Helper to verify room belongs to user's organization and get role
async function verifyRoomAccess(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  roomId: string
): Promise<{
  hasAccess: boolean
  isAdmin: boolean
  organizationId?: string
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Get user's organization and role
  const { data: membership } = await sb
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .single()

  if (!membership?.organization_id) {
    return { hasAccess: false, isAdmin: false }
  }

  // Check if room belongs to user's organization
  const { data: room } = await sb
    .from("video_rooms")
    .select("*")
    .eq("room_id", roomId)
    .eq("organization_id", membership.organization_id)
    .single()

  if (!room) {
    return { hasAccess: false, isAdmin: false }
  }

  const isAdmin = membership.role === "owner" || membership.role === "admin" || room.created_by === userId

  return { hasAccess: true, isAdmin, organizationId: membership.organization_id }
}

// ============================================
// GET - List waiting room participants
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

    // Verify access
    const { hasAccess } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get waiting room participants
    const { data: waiting, error } = await sb
      .from("waiting_room")
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq("room_id", roomId)
      .eq("status", "waiting")
      .order("requested_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: waiting || [],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Waiting Room API] Error fetching:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Join waiting room / Admit / Reject
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
    const body = await request.json()
    const { action, targetUserId, displayName } = body

    // Verify access
    const { hasAccess, isAdmin, organizationId } = await verifyRoomAccess(supabase, user.id, roomId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    switch (action) {
      case "join":
        // User joins waiting room
        const { data: existing } = await sb
          .from("waiting_room")
          .select("id, status")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .single()

        if (existing?.status === "waiting") {
          return NextResponse.json({
            success: true,
            data: { status: "already_waiting" },
          })
        }

        // Check if waiting room is enabled for this room
        const { data: room } = await sb
          .from("scheduled_meetings")
          .select("enable_waiting_room")
          .eq("room_id", roomId)
          .single()

        // If no scheduled meeting or waiting room not enabled, auto-admit
        if (!room?.enable_waiting_room) {
          return NextResponse.json({
            success: true,
            data: { status: "admitted", waitingRoomEnabled: false },
          })
        }

        // Add to waiting room
        await sb
          .from("waiting_room")
          .upsert({
            room_id: roomId,
            user_id: user.id,
            display_name: displayName || user.email?.split("@")[0] || "Guest",
            email: user.email,
            status: "waiting",
            requested_at: new Date().toISOString(),
          }, {
            onConflict: "room_id,user_id",
          })

        return NextResponse.json({
          success: true,
          data: { status: "waiting", waitingRoomEnabled: true },
        })

      case "admit":
        // Admin admits a participant
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, error: "Only admins can admit participants" },
            { status: 403 }
          )
        }

        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: "targetUserId required" },
            { status: 400 }
          )
        }

        await sb
          .from("waiting_room")
          .update({
            status: "admitted",
            processed_at: new Date().toISOString(),
            processed_by: user.id,
          })
          .eq("room_id", roomId)
          .eq("user_id", targetUserId)

        return NextResponse.json({
          success: true,
          data: { status: "admitted", userId: targetUserId },
        })

      case "admitAll":
        // Admin admits all waiting participants
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, error: "Only admins can admit participants" },
            { status: 403 }
          )
        }

        const { count } = await sb
          .from("waiting_room")
          .update({
            status: "admitted",
            processed_at: new Date().toISOString(),
            processed_by: user.id,
          })
          .eq("room_id", roomId)
          .eq("status", "waiting")

        return NextResponse.json({
          success: true,
          data: { status: "admitted_all", count },
        })

      case "reject":
        // Admin rejects a participant
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, error: "Only admins can reject participants" },
            { status: 403 }
          )
        }

        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: "targetUserId required" },
            { status: 400 }
          )
        }

        await sb
          .from("waiting_room")
          .update({
            status: "rejected",
            processed_at: new Date().toISOString(),
            processed_by: user.id,
          })
          .eq("room_id", roomId)
          .eq("user_id", targetUserId)

        return NextResponse.json({
          success: true,
          data: { status: "rejected", userId: targetUserId },
        })

      case "leave":
        // User leaves waiting room
        await sb
          .from("waiting_room")
          .delete()
          .eq("room_id", roomId)
          .eq("user_id", user.id)

        return NextResponse.json({
          success: true,
          data: { status: "left" },
        })

      case "checkStatus":
        // Check if user has been admitted or rejected
        const { data: waitingEntry } = await sb
          .from("waiting_room")
          .select("status")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .single()

        return NextResponse.json({
          success: true,
          data: { status: waitingEntry?.status || "not_found" },
        })

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Waiting Room API] Error:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
