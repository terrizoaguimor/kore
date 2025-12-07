// ============================================
// MEET ROOMS API ROUTE
// Proxies to telnyx-video Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

// Helper to generate unique room name
function generateRoomName(prefix: string): string {
  const adjectives = ['blue', 'green', 'red', 'swift', 'bright', 'calm', 'bold', 'cool']
  const nouns = ['meeting', 'room', 'space', 'hub', 'zone', 'call', 'chat', 'team']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)
  return `${prefix}-${adj}-${noun}-${num}`
}

// ============================================
// GET - List Video Rooms
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const result = await TelnyxVideo.listRooms(pageSize, page)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error fetching rooms:", error)
    return NextResponse.json(
      { success: false, error: error.message },
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

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single() as { data: { organization_id: string } | null }

    const body = await request.json()

    // Generate a unique name if not provided
    const roomName = body.unique_name || generateRoomName("kore-meet")

    const result = await TelnyxVideo.createRoom({
      uniqueName: roomName,
      maxParticipants: body.max_participants || 50,
      enableRecording: body.enable_recording ?? false,
      organizationId: membership?.organization_id,
      userId: user.id,
      webhookUrl: body.webhook_url,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error creating room:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
