import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// This endpoint is for internal use (middleware/edge functions)
// It uses service role to bypass RLS
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const {
      ip_address,
      user_agent,
      path,
      method = "GET",
      status_code,
      country,
      city,
      latitude,
      longitude,
      is_bot = false,
      is_suspicious = false,
      threat_level = "none",
      response_time_ms,
      detection,
    } = body

    if (!ip_address || !path) {
      return NextResponse.json(
        { error: "IP address and path are required" },
        { status: 400 }
      )
    }

    // Use the Supabase function to log the visit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("log_security_visit", {
      p_ip_address: ip_address,
      p_user_agent: user_agent,
      p_path: path,
      p_method: method,
      p_status_code: status_code,
      p_country: country,
      p_city: city,
      p_latitude: latitude,
      p_longitude: longitude,
      p_is_bot: is_bot,
      p_is_suspicious: is_suspicious,
      p_threat_level: threat_level,
      p_response_time_ms: response_time_ms,
      p_detection: detection ? JSON.stringify(detection) : null,
    })

    if (error) {
      console.error("Error logging visit:", error)
      // Don't fail the request, just log the error
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true, visit_id: data })
  } catch (error) {
    console.error("Error in log-visit:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Check if IP is blocked
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const ip = searchParams.get("ip")

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("is_ip_blocked", {
      check_ip: ip,
    })

    if (error) throw error

    return NextResponse.json({ is_blocked: data })
  } catch (error) {
    console.error("Error checking IP:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
