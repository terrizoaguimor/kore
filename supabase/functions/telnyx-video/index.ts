// Supabase Edge Function: Telnyx Video (KORE Meet)
// Path: /functions/v1/telnyx-video
// Handles all video operations: rooms, sessions, participants, recordings, compositions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
      return { error: data.errors?.[0]?.detail || data.error || 'Telnyx API error' }
    }

    return { data: data.data }
  } catch (error) {
    return { error: error.message }
  }
}

// ============================================
// VIDEO WEBHOOK EVENT TYPES
// ============================================
interface VideoWebhookEvent {
  id: string
  event_type: string
  occurred_at: string
  payload: {
    room_id?: string
    session_id?: string
    participant_id?: string
    recording_id?: string
    composition_id?: string
    [key: string]: unknown
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
  const path = url.pathname.replace('/functions/v1/telnyx-video', '')

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
      return await handleVideoWebhook(req, supabaseAdmin)
    }

    // ============================================
    // ROOMS API: /rooms
    // ============================================
    if (path === '/rooms' || path.startsWith('/rooms/')) {
      const pathParts = path.split('/').filter(Boolean)
      const roomId = pathParts[1]
      const subPath = pathParts[2]

      // GET /rooms - List rooms
      if (req.method === 'GET' && !roomId) {
        const pageSize = url.searchParams.get('page_size') || '20'
        const pageNumber = url.searchParams.get('page_number') || '1'

        const { data, error } = await telnyxRequest(
          `/rooms?page[size]=${pageSize}&page[number]=${pageNumber}`
        )

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /rooms - Create room
      if (req.method === 'POST' && !roomId) {
        const body = await req.json()

        const { data, error } = await telnyxRequest('/rooms', 'POST', {
          unique_name: body.unique_name,
          max_participants: body.max_participants || 50,
          enable_recording: body.enable_recording || false,
          webhook_event_url: body.webhook_url || Deno.env.get('TELNYX_VIDEO_WEBHOOK_URL'),
        })

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }

        // Save room to database
        const room = data as any
        await supabaseAdmin.from('video_rooms').insert({
          room_id: room.id,
          unique_name: room.unique_name,
          max_participants: room.max_participants,
          enable_recording: room.enable_recording,
          organization_id: body.organization_id,
          created_by: body.user_id,
        })

        return jsonResponse({ success: true, data })
      }

      // GET /rooms/:id - Get room
      if (req.method === 'GET' && roomId && !subPath) {
        const { data, error } = await telnyxRequest(`/rooms/${roomId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // PATCH /rooms/:id - Update room
      if (req.method === 'PATCH' && roomId && !subPath) {
        const body = await req.json()

        const { data, error } = await telnyxRequest(`/rooms/${roomId}`, 'PATCH', {
          unique_name: body.unique_name,
          max_participants: body.max_participants,
          enable_recording: body.enable_recording,
          webhook_event_url: body.webhook_url,
        })

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // DELETE /rooms/:id - Delete room
      if (req.method === 'DELETE' && roomId && !subPath) {
        const { error } = await telnyxRequest(`/rooms/${roomId}`, 'DELETE')

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }

        // Remove from database
        await supabaseAdmin.from('video_rooms').delete().eq('room_id', roomId)

        return jsonResponse({ success: true })
      }

      // POST /rooms/:id/actions/generate_join_client_token - Generate token
      if (req.method === 'POST' && roomId && subPath === 'token') {
        const body = await req.json()

        const { data, error } = await telnyxRequest(
          `/rooms/${roomId}/actions/generate_join_client_token`,
          'POST',
          {
            refresh_token_ttl_secs: body.refresh_token_ttl || 3600,
            token_ttl_secs: body.token_ttl || 600,
          }
        )

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /rooms/:id/actions/refresh_client_token - Refresh token
      if (req.method === 'POST' && roomId && subPath === 'refresh') {
        const body = await req.json()

        const { data, error } = await telnyxRequest(
          `/rooms/${roomId}/actions/refresh_client_token`,
          'POST',
          {
            refresh_token: body.refresh_token,
            token_ttl_secs: body.token_ttl || 600,
          }
        )

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }
    }

    // ============================================
    // SESSIONS API: /sessions
    // ============================================
    if (path.startsWith('/sessions/')) {
      const pathParts = path.split('/').filter(Boolean)
      const sessionId = pathParts[1]
      const subPath = pathParts[2]

      // GET /sessions/:id - Get session
      if (req.method === 'GET' && sessionId && !subPath) {
        const { data, error } = await telnyxRequest(`/room_sessions/${sessionId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /sessions/:id/actions/:action - Session actions
      if (req.method === 'POST' && sessionId && subPath) {
        let actionEndpoint = ''
        const body = await req.json()

        switch (subPath) {
          case 'end':
            actionEndpoint = `/room_sessions/${sessionId}/actions/end`
            break
          case 'mute':
            actionEndpoint = `/room_sessions/${sessionId}/actions/mute`
            break
          case 'unmute':
            actionEndpoint = `/room_sessions/${sessionId}/actions/unmute`
            break
          case 'kick':
            actionEndpoint = `/room_sessions/${sessionId}/actions/kick`
            break
          default:
            return jsonResponse({ success: false, error: `Unknown action: ${subPath}` }, 400)
        }

        const { data, error } = await telnyxRequest(actionEndpoint, 'POST', body)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // GET /sessions/:id/participants - List participants
      if (req.method === 'GET' && sessionId && subPath === 'participants') {
        const pageSize = url.searchParams.get('page_size') || '20'

        const { data, error } = await telnyxRequest(
          `/room_sessions/${sessionId}/participants?page[size]=${pageSize}`
        )

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }
    }

    // ============================================
    // PARTICIPANTS API: /participants
    // ============================================
    if (path.startsWith('/participants/')) {
      const pathParts = path.split('/').filter(Boolean)
      const participantId = pathParts[1]
      const action = pathParts[2]

      // POST /participants/:id/:action - Participant actions
      if (req.method === 'POST' && participantId && action) {
        let endpoint = `/room_participants/${participantId}/actions`

        switch (action) {
          case 'kick':
            endpoint += '/kick'
            break
          case 'mute':
            endpoint += '/mute'
            break
          case 'unmute':
            endpoint += '/unmute'
            break
          default:
            return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400)
        }

        const { data, error } = await telnyxRequest(endpoint, 'POST', {})

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
      const pathParts = path.split('/').filter(Boolean)
      const recordingId = pathParts[1]

      // GET /recordings - List recordings
      if (req.method === 'GET' && !recordingId) {
        const pageSize = url.searchParams.get('page_size') || '20'
        const roomId = url.searchParams.get('room_id')

        let endpoint = `/room_recordings?page[size]=${pageSize}`
        if (roomId) {
          endpoint += `&filter[room_id]=${roomId}`
        }

        const { data, error } = await telnyxRequest(endpoint)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // GET /recordings/:id - Get recording
      if (req.method === 'GET' && recordingId) {
        const { data, error } = await telnyxRequest(`/room_recordings/${recordingId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // DELETE /recordings/:id - Delete recording
      if (req.method === 'DELETE' && recordingId) {
        const { error } = await telnyxRequest(`/room_recordings/${recordingId}`, 'DELETE')

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true })
      }
    }

    // ============================================
    // COMPOSITIONS API: /compositions
    // ============================================
    if (path === '/compositions' || path.startsWith('/compositions/')) {
      const pathParts = path.split('/').filter(Boolean)
      const compositionId = pathParts[1]

      // GET /compositions - List compositions
      if (req.method === 'GET' && !compositionId) {
        const pageSize = url.searchParams.get('page_size') || '20'

        const { data, error } = await telnyxRequest(`/room_compositions?page[size]=${pageSize}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // POST /compositions - Create composition
      if (req.method === 'POST' && !compositionId) {
        const body = await req.json()

        const { data, error } = await telnyxRequest('/room_compositions', 'POST', {
          session_id: body.session_id,
          format: body.format || 'mp4',
          resolution: body.resolution || '1280x720',
          webhook_event_url: body.webhook_url || Deno.env.get('TELNYX_VIDEO_WEBHOOK_URL'),
        })

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // GET /compositions/:id - Get composition
      if (req.method === 'GET' && compositionId) {
        const { data, error } = await telnyxRequest(`/room_compositions/${compositionId}`)

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true, data })
      }

      // DELETE /compositions/:id - Delete composition
      if (req.method === 'DELETE' && compositionId) {
        const { error } = await telnyxRequest(`/room_compositions/${compositionId}`, 'DELETE')

        if (error) {
          return jsonResponse({ success: false, error }, 400)
        }
        return jsonResponse({ success: true })
      }
    }

    return jsonResponse({ success: false, error: 'Not found' }, 404)

  } catch (error) {
    console.error('Error:', error)
    return jsonResponse({ success: false, error: error.message }, 500)
  }
})

// ============================================
// VIDEO WEBHOOK HANDLER
// ============================================
async function handleVideoWebhook(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  try {
    const body = await req.json()
    const event = body.data as VideoWebhookEvent

    console.log(`[Video Webhook] Event: ${event.event_type}`, {
      room_id: event.payload.room_id,
      session_id: event.payload.session_id,
    })

    // Handle different event types
    switch (event.event_type) {
      // Session events
      case 'video.room.session.started':
        await supabase.from('video_sessions').insert({
          session_id: event.payload.session_id,
          room_id: event.payload.room_id,
          started_at: event.occurred_at,
          status: 'active',
        })
        break

      case 'video.room.session.ended':
        await supabase.from('video_sessions')
          .update({
            ended_at: event.occurred_at,
            status: 'ended',
          })
          .eq('session_id', event.payload.session_id)
        break

      // Participant events
      case 'video.room.participant.joined':
        await supabase.from('video_participants').insert({
          participant_id: event.payload.participant_id,
          session_id: event.payload.session_id,
          room_id: event.payload.room_id,
          joined_at: event.occurred_at,
        })
        break

      case 'video.room.participant.left':
        await supabase.from('video_participants')
          .update({ left_at: event.occurred_at })
          .eq('participant_id', event.payload.participant_id)
        break

      // Recording events
      case 'video.room.recording.started':
        await supabase.from('video_recordings').insert({
          recording_id: event.payload.recording_id,
          session_id: event.payload.session_id,
          room_id: event.payload.room_id,
          started_at: event.occurred_at,
          status: 'recording',
        })
        break

      case 'video.room.recording.ended':
        await supabase.from('video_recordings')
          .update({
            ended_at: event.occurred_at,
            status: 'completed',
            download_url: event.payload.download_url as string,
            duration_secs: event.payload.duration_secs as number,
            size_mb: event.payload.size_mb as number,
          })
          .eq('recording_id', event.payload.recording_id)
        break

      // Composition events
      case 'video.room.composition.completed':
        await supabase.from('video_compositions')
          .update({
            status: 'completed',
            download_url: event.payload.download_url as string,
            completed_at: event.occurred_at,
          })
          .eq('composition_id', event.payload.composition_id)
        break

      case 'video.room.composition.failed':
        await supabase.from('video_compositions')
          .update({
            status: 'failed',
            error: event.payload.error as string,
          })
          .eq('composition_id', event.payload.composition_id)
        break

      default:
        console.log(`[Video Webhook] Unhandled event: ${event.event_type}`)
    }

    return jsonResponse({ received: true })

  } catch (error) {
    console.error('[Video Webhook] Error:', error)
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
