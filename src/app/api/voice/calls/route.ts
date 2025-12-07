// ============================================
// VOICE CALLS API ROUTE
// List and initiate calls via Telnyx API
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxCalls, getTelnyxConfig } from "@/lib/telnyx/server"

// ============================================
// GET - List Call History from Database
// (Telnyx doesn't have a "list active calls" endpoint via SDK)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get calls from database (recent calls with status not "hangup" could be considered active)
    let query = (supabase as any)
      .from("voice_call_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit)

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    if (status) {
      query = query.eq("status", status)
    } else {
      // By default, get non-hangup calls (potentially active)
      query = query.neq("status", "hangup")
    }

    const { data: calls, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: calls || [],
    })
  } catch (error: any) {
    console.error("Error fetching calls:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch calls",
      },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Initiate Outbound Call
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      to,
      from,
      organizationId,
      answeringMachineDetection,
      timeoutSecs,
      timeLimitSecs,
      clientState,
    } = body

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' phone number" }, { status: 400 })
    }

    const config = getTelnyxConfig()

    // Use provided 'from' or default caller ID
    const callerNumber = from || config.defaultCallerId
    if (!callerNumber) {
      return NextResponse.json({ error: "Missing 'from' phone number and no default configured" }, { status: 400 })
    }

    // Dial the call using the Telnyx SDK
    const callData = await TelnyxCalls.dial({
      to,
      from: callerNumber,
      answeringMachineDetection: answeringMachineDetection || "detect",
      timeoutSecs: timeoutSecs || 30,
      timeLimitSecs,
      clientState: clientState ? Buffer.from(JSON.stringify(clientState)).toString("base64") : undefined,
    })

    // Log the call in database
    if (organizationId && callData) {
      await (supabase as any)
        .from("voice_call_logs")
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          call_control_id: callData.call_control_id,
          call_session_id: callData.call_session_id,
          call_leg_id: callData.call_leg_id,
          connection_id: config.connectionId,
          direction: "outbound",
          from_number: callerNumber,
          to_number: to,
          status: "ringing",
          started_at: new Date().toISOString(),
          metadata: clientState || {},
        })
    }

    return NextResponse.json({
      success: true,
      data: callData,
    })
  } catch (error: any) {
    console.error("Error initiating call:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initiate call",
      },
      { status: 500 }
    )
  }
}
