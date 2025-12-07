// ============================================
// MEET WEBHOOKS API ROUTE
// Handle Telnyx Video webhook events
// ============================================

import { NextRequest, NextResponse } from "next/server"
import type { VideoWebhookEvent } from "@/types/meet"

// ============================================
// POST - Handle Video Webhook Events
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.data as VideoWebhookEvent

    console.log(`[Meet Webhook] Received event: ${event.event_type}`, {
      id: event.id,
      occurred_at: event.occurred_at,
      room_id: event.payload?.room_id,
      session_id: event.payload?.session_id,
    })

    // Handle different event types
    switch (event.event_type) {
      // ============================================
      // SESSION EVENTS
      // ============================================
      case "video.room.session.started":
        console.log(`[Meet] Session started in room ${event.payload.room_id}`)
        // Could save to database, send notifications, etc.
        break

      case "video.room.session.ended":
        console.log(`[Meet] Session ended in room ${event.payload.room_id}`)
        // Could update meeting status, calculate duration, etc.
        break

      // ============================================
      // PARTICIPANT EVENTS
      // ============================================
      case "video.room.participant.joined":
        console.log(
          `[Meet] Participant ${event.payload.participant_id} joined room ${event.payload.room_id}`
        )
        // Could update participant count, send notifications, etc.
        break

      case "video.room.participant.left":
        console.log(
          `[Meet] Participant ${event.payload.participant_id} left room ${event.payload.room_id}`
        )
        // Could update participant count, calculate time spent, etc.
        break

      // ============================================
      // RECORDING EVENTS
      // ============================================
      case "video.room.recording.started":
        console.log(
          `[Meet] Recording started for session ${event.payload.session_id}`
        )
        // Could notify participants that recording started
        break

      case "video.room.recording.ended":
        console.log(
          `[Meet] Recording ended: ${event.payload.recording_id}`
        )
        // Could save recording info to database
        break

      // ============================================
      // COMPOSITION EVENTS
      // ============================================
      case "video.room.composition.completed":
        console.log(
          `[Meet] Composition completed: ${event.payload.composition_id}`
        )
        // Could notify user that composition is ready for download
        break

      case "video.room.composition.failed":
        console.log(
          `[Meet] Composition failed: ${event.payload.composition_id}`
        )
        // Could notify user of failure, retry, etc.
        break

      default:
        console.log(`[Meet] Unhandled event type: ${event.event_type}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[Meet Webhook] Error processing event:", error)
    // Still return 200 to prevent retries for malformed events
    return NextResponse.json(
      { error: "Failed to process event" },
      { status: 200 }
    )
  }
}

// ============================================
// GET - Webhook Health Check
// ============================================
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "KORE Meet Webhooks",
    timestamp: new Date().toISOString(),
  })
}
