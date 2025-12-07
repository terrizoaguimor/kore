// ============================================
// MEET ROOM API ROUTE
// Proxies to telnyx-video Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

interface RouteParams {
  params: Promise<{ roomId: string }>
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
    const result = await TelnyxVideo.getRoom(roomId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error getting room:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Room Actions (generateToken, refreshToken)
// ============================================
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roomId } = await params
    const body = await request.json()
    const { action, ...actionParams } = body

    let result

    switch (action) {
      case "generateToken":
        result = await TelnyxVideo.generateToken(roomId, {
          tokenTtl: actionParams.token_ttl_secs || 600,
          refreshTokenTtl: actionParams.refresh_token_ttl_secs || 3600,
        })
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
        break

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error executing room action:", error)
    return NextResponse.json(
      { success: false, error: error.message },
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
    const body = await request.json()

    const result = await TelnyxVideo.updateRoom(roomId, {
      uniqueName: body.unique_name,
      maxParticipants: body.max_participants,
      enableRecording: body.enable_recording,
      webhookUrl: body.webhook_event_url,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error updating room:", error)
    return NextResponse.json(
      { success: false, error: error.message },
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
    const result = await TelnyxVideo.deleteRoom(roomId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error deleting room:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
