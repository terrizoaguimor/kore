// ============================================
// MEET ROOMS API ROUTE
// Multi-tenant isolated video rooms
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

// Helper to generate unique room name with org prefix
function generateRoomName(orgSlug: string): string {
  const adjectives = ['blue', 'green', 'red', 'swift', 'bright', 'calm', 'bold', 'cool']
  const nouns = ['meeting', 'room', 'space', 'hub', 'zone', 'call', 'chat', 'team']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 10000)
  return `${orgSlug}-${adj}-${noun}-${num}`
}

// ============================================
// GET - List Video Rooms (Tenant Isolated)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id, organizations(id, slug)")
      .eq("user_id", user.id)
      .single()

    if (!membership?.organization_id) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "active"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    // Fetch rooms from local database filtered by organization
    let query = sb
      .from("video_rooms")
      .select(`
        *,
        created_by_user:users!video_rooms_created_by_fkey(id, email, full_name, avatar_url),
        active_sessions:video_sessions(count)
      `)
      .eq("organization_id", membership.organization_id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: rooms, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error fetching rooms:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create Video Room
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization with slug
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id, organizations(id, slug, name)")
      .eq("user_id", user.id)
      .single()

    if (!membership?.organization_id) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Generate a unique name with org prefix for namespace isolation
    const orgSlug = membership.organizations?.slug || "org"
    const roomName = body.unique_name || generateRoomName(orgSlug)

    // Create room via Telnyx Edge Function
    const telnyxResult = await TelnyxVideo.createRoom({
      uniqueName: roomName,
      maxParticipants: body.max_participants || 50,
      enableRecording: body.enable_recording ?? false,
      organizationId: membership.organization_id,
      userId: user.id,
      webhookUrl: body.webhook_url,
    })

    if (!telnyxResult.success) {
      return NextResponse.json(
        { success: false, error: telnyxResult.error || "Failed to create room" },
        { status: 500 }
      )
    }

    // The room should be saved to DB by the edge function, but let's fetch it
    const telnyxData = telnyxResult.data as { room_id?: string; id?: string } | undefined
    const { data: room } = await sb
      .from("video_rooms")
      .select("*")
      .eq("room_id", telnyxData?.room_id || telnyxData?.id || "")
      .single()

    return NextResponse.json({
      success: true,
      data: room || telnyxResult.data,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Meet API] Error creating room:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
