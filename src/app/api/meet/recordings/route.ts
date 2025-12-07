// ============================================
// MEET RECORDINGS API ROUTE
// Proxies to telnyx-video Edge Function
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TelnyxVideo } from "@/lib/edge-functions/client"

// ============================================
// GET - List Recordings
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
    const roomId = searchParams.get("roomId") || undefined
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const result = await TelnyxVideo.listRecordings(pageSize, roomId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error fetching recordings:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create Composition
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

    const body = await request.json()
    const { session_id, format, resolution } = body

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 }
      )
    }

    const result = await TelnyxVideo.createComposition({
      sessionId: session_id,
      format: format || "mp4",
      resolution: resolution || "1280x720",
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/meet/webhooks`,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Meet API] Error creating composition:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete Recording
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { recordingId, recordingIds } = body

    if (recordingIds && Array.isArray(recordingIds)) {
      // Delete multiple recordings
      const results = await Promise.all(
        recordingIds.map((id: string) => TelnyxVideo.deleteRecording(id))
      )

      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Failed to delete ${failed.length} recording(s)`,
        })
      }
    } else if (recordingId) {
      const result = await TelnyxVideo.deleteRecording(recordingId)
      if (!result.success) {
        return NextResponse.json(result, { status: 500 })
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Missing recordingId or recordingIds" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Recording(s) deleted",
    })
  } catch (error: any) {
    console.error("[Meet API] Error deleting recording:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
