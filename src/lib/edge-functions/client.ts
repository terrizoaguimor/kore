// ============================================
// EDGE FUNCTIONS CLIENT
// Call Supabase Edge Functions from Next.js
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  params?: Record<string, string>
  headers?: Record<string, string>
}

interface EdgeFunctionResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

/**
 * Call a Supabase Edge Function
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  path: string = '',
  options: EdgeFunctionOptions = {}
): Promise<EdgeFunctionResponse<T>> {
  const { method = 'GET', body, params, headers = {} } = options

  // Build URL with query params
  let url = `${SUPABASE_URL}/functions/v1/${functionName}${path}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: data.success !== false,
      data: data.data || data,
      error: data.error,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    }
  }
}

// ============================================
// TELNYX VOICE FUNCTIONS
// ============================================

export const TelnyxVoice = {
  // Calls
  async listCalls(pageSize = 20) {
    return callEdgeFunction('telnyx-voice', '/calls', {
      params: { page_size: String(pageSize) },
    })
  },

  async createCall(options: {
    to: string
    from?: string
    organizationId?: string
    webhookUrl?: string
    amdEnabled?: boolean
    clientState?: Record<string, unknown>
  }) {
    return callEdgeFunction('telnyx-voice', '/calls', {
      method: 'POST',
      body: {
        to: options.to,
        from: options.from,
        organization_id: options.organizationId,
        webhook_url: options.webhookUrl,
        amd_enabled: options.amdEnabled,
        client_state: options.clientState,
      },
    })
  },

  async getCall(callControlId: string) {
    return callEdgeFunction('telnyx-voice', `/calls/${callControlId}`)
  },

  async callAction(
    callControlId: string,
    action: 'answer' | 'hangup' | 'hold' | 'unhold' | 'mute' | 'unmute' | 'transfer' | 'dtmf' | 'speak' | 'play' | 'stop_play' | 'record_start' | 'record_stop' | 'gather',
    params?: Record<string, unknown>
  ) {
    return callEdgeFunction('telnyx-voice', `/calls/${callControlId}`, {
      method: 'POST',
      body: { action, ...params },
    })
  },

  // Recordings
  async listRecordings(pageSize = 20) {
    return callEdgeFunction('telnyx-voice', '/recordings', {
      params: { page_size: String(pageSize) },
    })
  },

  async getRecording(recordingId: string) {
    return callEdgeFunction('telnyx-voice', `/recordings/${recordingId}`)
  },

  async deleteRecording(recordingId: string) {
    return callEdgeFunction('telnyx-voice', `/recordings/${recordingId}`, {
      method: 'DELETE',
    })
  },

  // Phone Numbers
  async listPhoneNumbers(pageSize = 20) {
    return callEdgeFunction('telnyx-voice', '/phone-numbers', {
      params: { page_size: String(pageSize) },
    })
  },
}

// ============================================
// TELNYX VIDEO FUNCTIONS (KORE Meet)
// ============================================

export const TelnyxVideo = {
  // Rooms
  async listRooms(pageSize = 20, pageNumber = 1) {
    return callEdgeFunction('telnyx-video', '/rooms', {
      params: {
        page_size: String(pageSize),
        page_number: String(pageNumber),
      },
    })
  },

  async createRoom(options: {
    uniqueName?: string
    maxParticipants?: number
    enableRecording?: boolean
    organizationId?: string
    userId?: string
    webhookUrl?: string
  }) {
    return callEdgeFunction('telnyx-video', '/rooms', {
      method: 'POST',
      body: {
        unique_name: options.uniqueName,
        max_participants: options.maxParticipants,
        enable_recording: options.enableRecording,
        organization_id: options.organizationId,
        user_id: options.userId,
        webhook_url: options.webhookUrl,
      },
    })
  },

  async getRoom(roomId: string) {
    return callEdgeFunction('telnyx-video', `/rooms/${roomId}`)
  },

  async updateRoom(
    roomId: string,
    options: {
      uniqueName?: string
      maxParticipants?: number
      enableRecording?: boolean
      webhookUrl?: string
    }
  ) {
    return callEdgeFunction('telnyx-video', `/rooms/${roomId}`, {
      method: 'PATCH',
      body: {
        unique_name: options.uniqueName,
        max_participants: options.maxParticipants,
        enable_recording: options.enableRecording,
        webhook_url: options.webhookUrl,
      },
    })
  },

  async deleteRoom(roomId: string) {
    return callEdgeFunction('telnyx-video', `/rooms/${roomId}`, {
      method: 'DELETE',
    })
  },

  async generateToken(
    roomId: string,
    options?: {
      tokenTtl?: number
      refreshTokenTtl?: number
    }
  ) {
    return callEdgeFunction('telnyx-video', `/rooms/${roomId}/token`, {
      method: 'POST',
      body: {
        token_ttl: options?.tokenTtl,
        refresh_token_ttl: options?.refreshTokenTtl,
      },
    })
  },

  async refreshToken(
    roomId: string,
    refreshToken: string,
    tokenTtl?: number
  ) {
    return callEdgeFunction('telnyx-video', `/rooms/${roomId}/refresh`, {
      method: 'POST',
      body: {
        refresh_token: refreshToken,
        token_ttl: tokenTtl,
      },
    })
  },

  // Sessions
  async getSession(sessionId: string) {
    return callEdgeFunction('telnyx-video', `/sessions/${sessionId}`)
  },

  async sessionAction(
    sessionId: string,
    action: 'end' | 'mute' | 'unmute' | 'kick',
    params?: Record<string, unknown>
  ) {
    return callEdgeFunction('telnyx-video', `/sessions/${sessionId}/${action}`, {
      method: 'POST',
      body: params || {},
    })
  },

  async listSessionParticipants(sessionId: string, pageSize = 20) {
    return callEdgeFunction('telnyx-video', `/sessions/${sessionId}/participants`, {
      params: { page_size: String(pageSize) },
    })
  },

  // Participants
  async participantAction(
    participantId: string,
    action: 'kick' | 'mute' | 'unmute'
  ) {
    return callEdgeFunction('telnyx-video', `/participants/${participantId}/${action}`, {
      method: 'POST',
    })
  },

  // Recordings
  async listRecordings(pageSize = 20, roomId?: string) {
    const params: Record<string, string> = { page_size: String(pageSize) }
    if (roomId) params.room_id = roomId

    return callEdgeFunction('telnyx-video', '/recordings', { params })
  },

  async getRecording(recordingId: string) {
    return callEdgeFunction('telnyx-video', `/recordings/${recordingId}`)
  },

  async deleteRecording(recordingId: string) {
    return callEdgeFunction('telnyx-video', `/recordings/${recordingId}`, {
      method: 'DELETE',
    })
  },

  // Compositions
  async listCompositions(pageSize = 20) {
    return callEdgeFunction('telnyx-video', '/compositions', {
      params: { page_size: String(pageSize) },
    })
  },

  async createComposition(options: {
    sessionId: string
    format?: 'mp4' | 'webm'
    resolution?: string
    webhookUrl?: string
  }) {
    return callEdgeFunction('telnyx-video', '/compositions', {
      method: 'POST',
      body: {
        session_id: options.sessionId,
        format: options.format,
        resolution: options.resolution,
        webhook_url: options.webhookUrl,
      },
    })
  },

  async getComposition(compositionId: string) {
    return callEdgeFunction('telnyx-video', `/compositions/${compositionId}`)
  },

  async deleteComposition(compositionId: string) {
    return callEdgeFunction('telnyx-video', `/compositions/${compositionId}`, {
      method: 'DELETE',
    })
  },
}
