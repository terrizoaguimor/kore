// ============================================
// VOICE CALL CONTROL API ROUTE
// Proxies to telnyx-voice Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVoice } from "@/lib/edge-functions/client"

interface RouteParams {
  params: Promise<{ callControlId: string }>
}

// ============================================
// GET - Get Call Status
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

    const { callControlId } = await params
    const result = await TelnyxVoice.getCall(callControlId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Voice API] Error getting call status:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Call Control Actions
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

    const { callControlId } = await params
    const body = await request.json()
    const { action, ...actionParams } = body

    // Validate action
    const validActions = [
      'answer', 'hangup', 'hold', 'unhold', 'mute', 'unmute',
      'transfer', 'dtmf', 'speak', 'play', 'stop_play',
      'record_start', 'record_stop', 'gather'
    ]

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}` },
        { status: 400 }
      )
    }

    // Call Edge Function
    const result = await TelnyxVoice.callAction(callControlId, action, actionParams)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Voice API] Error executing call action:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Hangup Call
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

    const { callControlId } = await params
    const result = await TelnyxVoice.callAction(callControlId, 'hangup')

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Voice API] Error hanging up call:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
