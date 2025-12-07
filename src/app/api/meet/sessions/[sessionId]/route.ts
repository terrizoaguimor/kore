// ============================================
// MEET SESSION API ROUTE
// Proxies to telnyx-video Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

// ============================================
// GET - Get Session Details
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

    const { sessionId } = await params

    // Get session details
    const sessionResult = await TelnyxVideo.getSession(sessionId)

    // Get participants
    const participantsResult = await TelnyxVideo.listSessionParticipants(sessionId)

    return NextResponse.json({
      success: true,
      data: {
        ...(sessionResult.data || {}),
        participants: participantsResult.data || [],
      },
    })
  } catch (error: any) {
    console.error("[Meet API] Error getting session:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Session Actions (end, mute, kick)
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

    const { sessionId } = await params
    const body = await request.json()
    const { action, ...actionParams } = body

    let result

    switch (action) {
      case "end":
        result = await TelnyxVideo.sessionAction(sessionId, 'end')
        break

      case "muteAll":
        result = await TelnyxVideo.sessionAction(sessionId, 'mute')
        break

      case "unmuteAll":
        result = await TelnyxVideo.sessionAction(sessionId, 'unmute')
        break

      case "kickAll":
        result = await TelnyxVideo.sessionAction(sessionId, 'kick')
        break

      case "kickParticipant":
        if (!actionParams.participantId) {
          return NextResponse.json(
            { success: false, error: "Missing participantId" },
            { status: 400 }
          )
        }
        result = await TelnyxVideo.participantAction(actionParams.participantId, 'kick')
        break

      case "muteParticipant":
        if (!actionParams.participantId) {
          return NextResponse.json(
            { success: false, error: "Missing participantId" },
            { status: 400 }
          )
        }
        result = await TelnyxVideo.participantAction(actionParams.participantId, 'mute')
        break

      case "unmuteParticipant":
        if (!actionParams.participantId) {
          return NextResponse.json(
            { success: false, error: "Missing participantId" },
            { status: 400 }
          )
        }
        result = await TelnyxVideo.participantAction(actionParams.participantId, 'unmute')
        break

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed`,
      ...(result?.data ? { data: result.data } : {}),
    })
  } catch (error: any) {
    console.error("[Meet API] Error executing session action:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - End Session
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

    const { sessionId } = await params
    const result = await TelnyxVideo.sessionAction(sessionId, 'end')

    return NextResponse.json({
      success: true,
      message: "Session ended",
      ...(result?.data ? { data: result.data } : {}),
    })
  } catch (error: any) {
    console.error("[Meet API] Error ending session:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
