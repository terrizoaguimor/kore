// ============================================
// TELNYX WEBHOOKS HANDLER
// Receives and processes Telnyx events
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type {
  TelnyxWebhookEvent,
  TelnyxWebhookEventType,
  CallInitiatedPayload,
  CallAnsweredPayload,
  CallHangupPayload,
  GatherEndedPayload,
  DtmfReceivedPayload,
  RecordingSavedPayload,
  MachineDetectionPayload,
} from "@/types/telnyx"

// ============================================
// WEBHOOK SIGNATURE VERIFICATION (Optional)
// ============================================
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  // Telnyx webhook verification
  // In production, implement proper signature verification
  // using TELNYX_WEBHOOK_SECRET
  const webhookSecret = process.env.TELNYX_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.warn("TELNYX_WEBHOOK_SECRET not set, skipping verification")
    return true
  }

  if (!signature || !timestamp) {
    return false
  }

  // Implement HMAC verification here
  // crypto.createHmac('sha256', webhookSecret)
  //   .update(`${timestamp}.${payload}`)
  //   .digest('hex')

  return true
}

// ============================================
// EVENT HANDLERS
// ============================================
async function handleCallInitiated(
  payload: CallInitiatedPayload,
  supabase: any
) {
  console.log("[Webhook] Call initiated:", payload.call_control_id)

  // For inbound calls, create a log entry
  if (payload.direction === "inbound") {
    await supabase.from("voice_call_logs").insert({
      call_control_id: payload.call_control_id,
      call_session_id: payload.call_session_id,
      call_leg_id: payload.call_leg_id,
      connection_id: payload.connection_id,
      direction: payload.direction,
      from_number: payload.from,
      to_number: payload.to,
      status: "ringing",
      started_at: payload.start_time,
    })
  }

  // TODO: Notify connected clients via WebSocket/Realtime
  // TODO: Trigger IVR flow for inbound calls if configured
}

async function handleCallAnswered(
  payload: CallAnsweredPayload,
  supabase: any
) {
  console.log("[Webhook] Call answered:", payload.call_control_id)

  await supabase
    .from("voice_call_logs")
    .update({
      status: "answered",
      answered_at: payload.answer_time,
    })
    .eq("call_control_id", payload.call_control_id)

  // TODO: Notify connected clients
}

async function handleCallHangup(
  payload: CallHangupPayload,
  supabase: any
) {
  console.log("[Webhook] Call hangup:", payload.call_control_id, payload.hangup_cause)

  // Calculate duration if answered
  const { data: callLog } = await supabase
    .from("voice_call_logs")
    .select("answered_at")
    .eq("call_control_id", payload.call_control_id)
    .single()

  let durationSeconds: number | null = null
  if (callLog?.answered_at) {
    const answerTime = new Date(callLog.answered_at).getTime()
    const endTime = new Date(payload.end_time).getTime()
    durationSeconds = Math.floor((endTime - answerTime) / 1000)
  }

  await supabase
    .from("voice_call_logs")
    .update({
      status: "hangup",
      hangup_cause: payload.hangup_cause,
      ended_at: payload.end_time,
      duration_seconds: durationSeconds,
    })
    .eq("call_control_id", payload.call_control_id)

  // TODO: Notify connected clients
}

async function handleGatherEnded(
  payload: GatherEndedPayload,
  supabase: any
) {
  console.log("[Webhook] Gather ended:", payload.call_control_id, "Digits:", payload.digits)

  // Store gather result
  await supabase.from("voice_call_events").insert({
    call_control_id: payload.call_control_id,
    event_type: "gather_ended",
    data: {
      digits: payload.digits,
      status: payload.status,
    },
  })

  // TODO: Process IVR input based on digits
}

async function handleDtmfReceived(
  payload: DtmfReceivedPayload,
  supabase: any
) {
  console.log("[Webhook] DTMF received:", payload.call_control_id, "Digit:", payload.digit)

  await supabase.from("voice_call_events").insert({
    call_control_id: payload.call_control_id,
    event_type: "dtmf_received",
    data: { digit: payload.digit },
  })
}

async function handleRecordingSaved(
  payload: RecordingSavedPayload,
  supabase: any
) {
  console.log("[Webhook] Recording saved:", payload.recording_id)

  // Update call log with recording URL
  await supabase
    .from("voice_call_logs")
    .update({
      recording_url: payload.public_recording_urls.mp3 || payload.public_recording_urls.wav,
    })
    .eq("call_control_id", payload.call_control_id)

  // Create recording record
  await supabase.from("voice_recordings").insert({
    recording_id: payload.recording_id,
    call_control_id: payload.call_control_id,
    call_session_id: payload.call_session_id,
    call_leg_id: payload.call_leg_id,
    connection_id: payload.connection_id,
    channels: payload.channels,
    recording_started_at: payload.recording_started_at,
    recording_ended_at: payload.recording_ended_at,
    mp3_url: payload.public_recording_urls.mp3,
    wav_url: payload.public_recording_urls.wav,
  })
}

async function handleMachineDetection(
  payload: MachineDetectionPayload,
  supabase: any
) {
  console.log("[Webhook] Machine detection:", payload.call_control_id, "Result:", payload.result)

  await supabase.from("voice_call_events").insert({
    call_control_id: payload.call_control_id,
    event_type: "machine_detection",
    data: { result: payload.result },
  })

  // TODO: Handle voicemail detection - leave message or hangup
}

// ============================================
// MAIN WEBHOOK HANDLER
// ============================================
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("telnyx-signature-ed25519")
    const timestamp = request.headers.get("telnyx-timestamp")

    // Verify webhook signature in production
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload) as TelnyxWebhookEvent

    console.log(`[Webhook] Received event: ${event.data.event_type}`)

    const supabase = await createClient()
    const eventType = event.data.event_type
    const eventPayload = event.data.payload

    // Route to appropriate handler
    switch (eventType) {
      case "call.initiated":
        await handleCallInitiated(eventPayload as CallInitiatedPayload, supabase)
        break

      case "call.answered":
        await handleCallAnswered(eventPayload as CallAnsweredPayload, supabase)
        break

      case "call.hangup":
        await handleCallHangup(eventPayload as CallHangupPayload, supabase)
        break

      case "call.gather.ended":
        await handleGatherEnded(eventPayload as GatherEndedPayload, supabase)
        break

      case "call.dtmf.received":
        await handleDtmfReceived(eventPayload as DtmfReceivedPayload, supabase)
        break

      case "call.recording.saved":
        await handleRecordingSaved(eventPayload as RecordingSavedPayload, supabase)
        break

      case "call.machine.detection.ended":
      case "call.machine.premium.detection.ended":
        await handleMachineDetection(eventPayload as MachineDetectionPayload, supabase)
        break

      case "call.bridged":
        console.log("[Webhook] Call bridged:", (eventPayload as any).call_control_id)
        break

      case "call.speak.started":
      case "call.speak.ended":
        console.log(`[Webhook] ${eventType}:`, (eventPayload as any).call_control_id)
        break

      case "call.playback.started":
      case "call.playback.ended":
        console.log(`[Webhook] ${eventType}:`, (eventPayload as any).call_control_id)
        break

      case "conference.created":
      case "conference.ended":
      case "conference.participant.joined":
      case "conference.participant.left":
        console.log(`[Webhook] Conference event: ${eventType}`)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    // Still return 200 to prevent retries for parsing errors
    return NextResponse.json({ received: true, error: "Processing error" })
  }
}

// ============================================
// GET - Webhook health check
// ============================================
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "telnyx-webhooks",
    timestamp: new Date().toISOString(),
  })
}
