import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getGeoLocation } from "@/lib/security/geo"

// This endpoint is for internal use (middleware) - requires organization context
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const {
      ip_address,
      user_agent,
      path,
      method = "GET",
      status_code,
      is_bot = false,
      is_suspicious = false,
      threat_level = "none",
      response_time_ms,
      detection,
      organization_id, // Accept organization_id from the caller
    } = body

    if (!ip_address || !path) {
      return NextResponse.json(
        { error: "IP address and path are required" },
        { status: 400 }
      )
    }

    // If no organization_id provided, try to get from authenticated user
    let orgId = organization_id
    if (!orgId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await sb
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .single()
        orgId = membership?.organization_id
      }
    }

    // Get geo-location data (async, with timeout)
    let country: string | null = null
    let city: string | null = null
    let latitude: number | null = null
    let longitude: number | null = null

    try {
      const geo = await getGeoLocation(ip_address)
      if (geo) {
        country = geo.country
        city = geo.city
        latitude = geo.latitude
        longitude = geo.longitude
      }
    } catch {
      // Continue without geo data
    }

    // Log the visit with organization context
    const { data, error } = await sb.rpc("log_security_visit", {
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
      p_organization_id: orgId,
    })

    if (error) {
      console.error("Error logging visit:", error)
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

// Check if IP is blocked (for specific organization)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const { searchParams } = new URL(request.url)
    const ip = searchParams.get("ip")
    const orgId = searchParams.get("organization_id")

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Check if IP is blocked for this organization
    const { data, error } = await sb.rpc("is_ip_blocked", {
      check_ip: ip,
      check_organization_id: orgId || null,
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
