// ============================================
// VOICE CALLS API ROUTE
// With Tenant Isolation
// Proxies to telnyx-voice Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { TelnyxVoice } from "@/lib/edge-functions/client"
import { getTenantContext } from "@/lib/tenant"

// ============================================
// GET - List Call History (Tenant Isolated)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      )
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const searchParams = request.nextUrl.searchParams
    const pageSize = parseInt(searchParams.get("page_size") || "20")
    const page = parseInt(searchParams.get("page") || "1")

    // Fetch call history from local database filtered by organization
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: calls, error: queryError, count } = await sb
      .from("voice_calls")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (queryError) {
      console.error("[Voice API] Error fetching calls:", queryError)
      // Fallback to Telnyx API for active calls
      const result = await TelnyxVoice.listCalls(pageSize)
      return NextResponse.json(result)
    }

    return NextResponse.json({
      success: true,
      data: {
        calls: calls || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    })
  } catch (error: any) {
    console.error("[Voice API] Error listing calls:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create outbound call (Tenant Isolated)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.to) {
      return NextResponse.json(
        { success: false, error: "Missing 'to' phone number" },
        { status: 400 }
      )
    }

    // Call Edge Function with organization context
    const result = await TelnyxVoice.createCall({
      to: body.to,
      from: body.from,
      organizationId: context.organizationId,
      webhookUrl: body.webhook_url,
      amdEnabled: body.amd_enabled,
      clientState: body.client_state,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Voice API] Error creating call:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
