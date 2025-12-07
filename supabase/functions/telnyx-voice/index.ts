// Supabase Edge Function: Telnyx Voice
// Path: /functions/v1/telnyx-voice
// Handles all voice operations: calls, webhooks, recordings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY') || ''
const TELNYX_API_BASE = 'https://api.telnyx.com/v2'

// ============================================
// TELNYX API HELPER
// ============================================
async function telnyxRequest(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>
): Promise<{ data?: unknown; error?: string }> {
  try {
    const response = await fetch(`${TELNYX_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.errors?.[0]?.detail || 'Telnyx API error' }
    }

    return { data: data.data }
  } catch (error) {
    return { error: error.message }
  }
}

// ============================================
// WEBHOOK EVENT TYPES
// ============================================
interface TelnyxWebhookEvent {
  data: {
    event_type: string
    id: string
    occurred_at: string
    payload: {
      call_control_id?: string
      call_leg_id?: string
      call_session_id?: string
      client_state?: string
      connection_id?: string
      direction?: 'incoming' | 'outgoing'
      from?: string
      to?: string
      state?: string
      recording_urls?: { mp3?: string; wav?: string }
      transcription?: { text: string }
      digit?: string
      result?: string
      hangup_cause?: string
      hangup_source?: string
      sip_hangup_cause?: string
    }
    record_type: string
  }
  meta: {
    attempt: number
    delivered_to: string
  }
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/telnyx-voice', '')

  // Create Supabase client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // ============================================
    // WEBHOOK HANDLER: POST /webhook
    // ============================================
    if (path === '/webhook' && req.method === 'POST') {
      return await handleWebhook(req, supabaseAdmin)
    }

    // ============================================
    // CALLS API: /calls
    // ============================================
    if (path === '/calls' || path.startsWith('/calls/')) {
      const callControlId = path.replace('/calls/', '').replace('/calls', '')

      // GET /calls - List active calls
      if (req.method === 'GET' && !callControlId) {
        const pageSize = url.searchParams.get('page_size') || '20'
        const { data, error } = await telnyxRequest(`/calls?page[size]=${pageSize}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /calls - Create outbound call
      if (req.method === 'POST' && !callControlId) {
        const body = await req.json()
        const connectionId = Deno.env.get('TELNYX_CONNECTION_ID')

        const { data, error } = await telnyxRequest('/calls', 'POST', {
          connection_id: connectionId,
          to: body.to,
          from: body.from || Deno.env.get('TELNYX_DEFAULT_CALLER_ID'),
          webhook_url: body.webhook_url,
          webhook_url_method: 'POST',
          answering_machine_detection: body.amd_enabled ? 'detect' : 'disabled',
          client_state: body.client_state ? btoa(JSON.stringify(body.client_state)) : undefined,
        })

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }

        // Save call to database
        await supabaseAdmin.from('voice_calls').insert({
          call_control_id: (data as any).call_control_id,
          call_session_id: (data as any).call_session_id,
          direction: 'outbound',
          from_number: body.from || Deno.env.get('TELNYX_DEFAULT_CALLER_ID'),
          to_number: body.to,
          status: 'initiated',
          organization_id: body.organization_id,
        })

        return jsonResponse({ success: true, data })
      }

      // GET /calls/:id - Get call info
      if (req.method === 'GET' && callControlId) {
        const { data, error } = await telnyxRequest(`/calls/${callControlId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /calls/:id - Call control actions
      if (req.method === 'POST' && callControlId) {
        const body = await req.json()
        const action = body.action

        let endpoint = `/calls/${callControlId}/actions`
        let actionBody: Record<string, unknown> = {}

        switch (action) {
          case 'answer':
            endpoint += '/answer'
            break
          case 'hangup':
            endpoint += '/hangup'
            break
          case 'transfer':
            endpoint += '/transfer'
            actionBody = { to: body.to }
            break
          case 'hold':
            endpoint += '/hold'
            break
          case 'unhold':
            endpoint += '/unhold'
            break
          case 'mute':
            endpoint += '/mute'
            break
          case 'unmute':
            endpoint += '/unmute'
            break
          case 'dtmf':
            endpoint += '/send_dtmf'
            actionBody = { digits: body.digits }
            break
          case 'speak':
            endpoint += '/speak'
            actionBody = {
              payload: body.text,
              voice: body.voice || 'female',
              language: body.language || 'en-US',
            }
            break
          case 'play':
            endpoint += '/playback_start'
            actionBody = { audio_url: body.audio_url }
            break
          case 'stop_play':
            endpoint += '/playback_stop'
            break
          case 'record_start':
            endpoint += '/record_start'
            actionBody = {
              format: body.format || 'mp3',
              channels: body.channels || 'dual',
            }
            break
          case 'record_stop':
            endpoint += '/record_stop'
            break
          case 'gather':
            endpoint += '/gather'
            actionBody = {
              maximum_digits: body.max_digits || 1,
              timeout_millis: body.timeout || 10000,
              terminating_digit: body.terminating_digit || '#',
            }
            break
          default:
            return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400)
        }

        const { data, error } = await telnyxRequest(endpoint, 'POST', actionBody)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }
    }

    // ============================================
    // RECORDINGS API: /recordings
    // ============================================
    if (path === '/recordings' || path.startsWith('/recordings/')) {
      const recordingId = path.replace('/recordings/', '').replace('/recordings', '')

      // GET /recordings - List recordings
      if (req.method === 'GET' && !recordingId) {
        const pageSize = url.searchParams.get('page_size') || '20'
        const { data, error } = await telnyxRequest(`/recordings?page[size]=${pageSize}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // GET /recordings/:id - Get recording
      if (req.method === 'GET' && recordingId) {
        const { data, error } = await telnyxRequest(`/recordings/${recordingId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // DELETE /recordings/:id - Delete recording
      if (req.method === 'DELETE' && recordingId) {
        const { error } = await telnyxRequest(`/recordings/${recordingId}`, 'DELETE')

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true })
      }
    }

    // ============================================
    // PHONE NUMBERS API: /phone-numbers
    // ============================================
    if (path === '/phone-numbers') {
      if (req.method === 'GET') {
        const pageSize = url.searchParams.get('page_size') || '20'
        const { data, error } = await telnyxRequest(`/phone_numbers?page[size]=${pageSize}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }
    }

    return jsonResponse({ success: false, error: 'Not found' }, 404)

  } catch (error) {
    console.error('Error:', error)
    return jsonResponse({ success: false, error: error.message }, 500)
  }
})

// ============================================
// WEBHOOK HANDLER
// ============================================
async function handleWebhook(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  try {
    const event: TelnyxWebhookEvent = await req.json()
    const { event_type, payload } = event.data

    console.log(`[Voice Webhook] Event: ${event_type}`, {
      call_control_id: payload.call_control_id,
      direction: payload.direction,
    })

    // Update call in database based on event
    const callUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    switch (event_type) {
      case 'call.initiated':
        callUpdate.status = 'initiated'
        break

      case 'call.answered':
        callUpdate.status = 'answered'
        callUpdate.answered_at = new Date().toISOString()
        break

      case 'call.hangup':
        callUpdate.status = 'completed'
        callUpdate.ended_at = new Date().toISOString()
        callUpdate.hangup_cause = payload.hangup_cause
        callUpdate.hangup_source = payload.hangup_source
        break

      case 'call.recording.saved':
        // Save recording info
        if (payload.recording_urls) {
          await supabase.from('voice_recordings').insert({
            call_control_id: payload.call_control_id,
            recording_url_mp3: payload.recording_urls.mp3,
            recording_url_wav: payload.recording_urls.wav,
            created_at: new Date().toISOString(),
          })
        }
        break

      case 'call.dtmf.received':
        console.log(`DTMF received: ${payload.digit}`)
        break

      case 'call.speak.ended':
      case 'call.playback.ended':
        console.log(`Playback ended for call ${payload.call_control_id}`)
        break

      case 'call.gather.ended':
        console.log(`Gather result: ${payload.result}`)
        break

      case 'call.machine.detection.ended':
        console.log(`AMD result: ${payload.result}`)
        break
    }

    // Update call record if we have data
    if (payload.call_control_id && Object.keys(callUpdate).length > 1) {
      await supabase
        .from('voice_calls')
        .update(callUpdate)
        .eq('call_control_id', payload.call_control_id)
    }

    return jsonResponse({ received: true })

  } catch (error) {
    console.error('[Voice Webhook] Error:', error)
    // Return 200 to prevent retries
    return jsonResponse({ error: error.message }, 200)
  }
}

// ============================================
// HELPER
// ============================================
function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
