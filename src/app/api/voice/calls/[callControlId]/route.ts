// ============================================
// VOICE CALL CONTROL API ROUTE
// Manage individual calls via Telnyx API
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  TelnyxCalls,
  TelnyxSpeak,
  TelnyxGather,
  TelnyxAudio,
  TelnyxRecording,
} from "@/lib/telnyx/server"

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callControlId } = await params
    const response = await TelnyxCalls.get(callControlId)

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error("Error getting call status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get call status",
      },
      { status: error.statusCode || 500 }
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callControlId } = await params
    const body = await request.json()
    const { action, ...actionParams } = body

    let response

    switch (action) {
      // ============================================
      // CALL ACTIONS
      // ============================================
      case "answer":
        response = await TelnyxCalls.answer(callControlId, actionParams)
        break

      case "hangup":
        response = await TelnyxCalls.hangup(callControlId, actionParams)
        break

      case "transfer":
        if (!actionParams.to) {
          return NextResponse.json({ error: "Missing 'to' for transfer" }, { status: 400 })
        }
        response = await TelnyxCalls.transfer({
          callControlId,
          to: actionParams.to,
          from: actionParams.from,
          audioUrl: actionParams.audioUrl,
          answeringMachineDetection: actionParams.answeringMachineDetection,
          timeoutSecs: actionParams.timeoutSecs,
          timeLimitSecs: actionParams.timeLimitSecs,
        })
        break

      case "bridge":
        if (!actionParams.targetCallControlId) {
          return NextResponse.json({ error: "Missing 'targetCallControlId'" }, { status: 400 })
        }
        response = await TelnyxCalls.bridge(
          callControlId,
          actionParams.targetCallControlId,
          actionParams
        )
        break

      case "reject":
        response = await TelnyxCalls.reject(callControlId, {
          cause: actionParams.cause || "call_rejected",
        })
        break

      // ============================================
      // SPEAK ACTIONS (TTS)
      // ============================================
      case "speak":
        if (!actionParams.payload || !actionParams.voice) {
          return NextResponse.json({ error: "Missing 'payload' or 'voice'" }, { status: 400 })
        }
        response = await TelnyxSpeak.speak({
          callControlId,
          payload: actionParams.payload,
          voice: actionParams.voice,
          language: actionParams.language || "en-US",
          payloadType: actionParams.payloadType,
          serviceLevel: actionParams.serviceLevel,
        })
        break

      case "stopSpeak":
        response = await TelnyxSpeak.stop(callControlId)
        break

      // ============================================
      // GATHER ACTIONS (DTMF)
      // ============================================
      case "gather":
        response = await TelnyxGather.gather({
          callControlId,
          minimumDigits: actionParams.minimumDigits,
          maximumDigits: actionParams.maximumDigits,
          maximumTries: actionParams.maximumTries,
          timeoutMillis: actionParams.timeoutMillis,
          terminatingDigit: actionParams.terminatingDigit,
          validDigits: actionParams.validDigits,
          interDigitTimeoutMillis: actionParams.interDigitTimeoutMillis,
        })
        break

      case "gatherUsingAudio":
        if (!actionParams.audioUrl) {
          return NextResponse.json({ error: "Missing 'audioUrl' for gather" }, { status: 400 })
        }
        response = await TelnyxGather.gatherUsingAudio({
          callControlId,
          audioUrl: actionParams.audioUrl,
          minimumDigits: actionParams.minimumDigits,
          maximumDigits: actionParams.maximumDigits,
          maximumTries: actionParams.maximumTries,
          timeoutMillis: actionParams.timeoutMillis,
          terminatingDigit: actionParams.terminatingDigit,
          validDigits: actionParams.validDigits,
          interDigitTimeoutMillis: actionParams.interDigitTimeoutMillis,
        })
        break

      case "gatherUsingSpeak":
        if (!actionParams.payload || !actionParams.voice) {
          return NextResponse.json({ error: "Missing 'payload' or 'voice' for speak" }, { status: 400 })
        }
        response = await TelnyxGather.gatherUsingSpeak({
          callControlId,
          payload: actionParams.payload,
          voice: actionParams.voice,
          language: actionParams.language || "en-US",
          payloadType: actionParams.payloadType,
          minimumDigits: actionParams.minimumDigits,
          maximumDigits: actionParams.maximumDigits,
          maximumTries: actionParams.maximumTries,
          timeoutMillis: actionParams.timeoutMillis,
          terminatingDigit: actionParams.terminatingDigit,
          validDigits: actionParams.validDigits,
          interDigitTimeoutMillis: actionParams.interDigitTimeoutMillis,
        })
        break

      case "stopGather":
        response = await TelnyxGather.stop(callControlId)
        break

      case "sendDtmf":
        if (!actionParams.digits) {
          return NextResponse.json({ error: "Missing 'digits'" }, { status: 400 })
        }
        response = await TelnyxGather.sendDtmf(
          callControlId,
          actionParams.digits,
          { durationMillis: actionParams.durationMillis }
        )
        break

      // ============================================
      // AUDIO PLAYBACK ACTIONS
      // ============================================
      case "playAudio":
        if (!actionParams.audioUrl) {
          return NextResponse.json({ error: "Missing 'audioUrl'" }, { status: 400 })
        }
        response = await TelnyxAudio.play({
          callControlId,
          audioUrl: actionParams.audioUrl,
          loop: actionParams.loop,
          overlay: actionParams.overlay,
          targetLegs: actionParams.targetLegs,
        })
        break

      case "stopAudio":
        response = await TelnyxAudio.stop(callControlId)
        break

      // ============================================
      // RECORDING ACTIONS
      // ============================================
      case "recordStart":
        response = await TelnyxRecording.start({
          callControlId,
          format: actionParams.format || "mp3",
          channels: actionParams.channels || "single",
          playBeep: actionParams.playBeep ?? true,
          maxLength: actionParams.maxLength,
          timeoutSecs: actionParams.timeoutSecs,
        })
        break

      case "recordStop":
        response = await TelnyxRecording.stop(callControlId)
        break

      case "recordPause":
        response = await TelnyxRecording.pause(callControlId)
        break

      case "recordResume":
        response = await TelnyxRecording.resume(callControlId)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error("Error executing call action:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute action",
      },
      { status: error.statusCode || 500 }
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callControlId } = await params
    await TelnyxCalls.hangup(callControlId)

    return NextResponse.json({
      success: true,
      message: "Call terminated",
    })
  } catch (error: any) {
    console.error("Error hanging up call:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to hangup call",
      },
      { status: error.statusCode || 500 }
    )
  }
}
