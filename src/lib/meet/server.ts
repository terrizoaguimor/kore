// ============================================
// KORE MEET - Server Library
// Telnyx Video API Integration
// ============================================

import Telnyx from "telnyx"
import type {
  VideoRoom,
  CreateRoomOptions,
  UpdateRoomOptions,
  ClientToken,
  GenerateTokenOptions,
  RoomSession,
  Participant,
  Recording,
  RoomComposition,
  CreateCompositionOptions,
} from "@/types/meet"

// ============================================
// TELNYX CLIENT INITIALIZATION
// ============================================

let telnyxClient: Telnyx | null = null

function getTelnyxClient(): Telnyx {
  if (!telnyxClient) {
    const apiKey = process.env.TELNYX_API_KEY
    if (!apiKey) {
      throw new Error("TELNYX_API_KEY environment variable is not set")
    }
    telnyxClient = new Telnyx({ apiKey })
  }
  return telnyxClient
}

// ============================================
// VIDEO ROOMS API
// ============================================

export const MeetRooms = {
  /**
   * Create a new video room
   */
  async create(options: CreateRoomOptions): Promise<VideoRoom> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.create({
      unique_name: options.unique_name,
      max_participants: options.max_participants || 50,
      enable_recording: options.enable_recording ?? false,
      webhook_event_url: options.webhook_event_url,
      webhook_event_failover_url: options.webhook_event_failover_url,
    })

    return response.data as VideoRoom
  },

  /**
   * List all video rooms
   */
  async list(filters?: {
    page?: number
    pageSize?: number
    dateCreatedAfter?: string
    dateCreatedBefore?: string
  }): Promise<{ data: VideoRoom[]; meta: any }> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.list({
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize || 20,
      "filter[date_created_at][gte]": filters?.dateCreatedAfter,
      "filter[date_created_at][lte]": filters?.dateCreatedBefore,
    } as any)

    return {
      data: response.data as VideoRoom[],
      meta: response.meta,
    }
  },

  /**
   * Get a specific video room
   */
  async get(roomId: string): Promise<VideoRoom> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.retrieve(roomId)
    return response.data as VideoRoom
  },

  /**
   * Update a video room
   */
  async update(roomId: string, options: UpdateRoomOptions): Promise<VideoRoom> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.update(roomId, {
      unique_name: options.unique_name,
      max_participants: options.max_participants,
      enable_recording: options.enable_recording,
      webhook_event_url: options.webhook_event_url,
      webhook_event_failover_url: options.webhook_event_failover_url,
    } as any)

    return response.data as VideoRoom
  },

  /**
   * Delete a video room
   */
  async delete(roomId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).rooms.delete(roomId)
  },

  /**
   * Generate a client token to join a room
   */
  async generateClientToken(
    roomId: string,
    options?: GenerateTokenOptions
  ): Promise<ClientToken> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.createClientToken(roomId, {
      token_ttl_secs: options?.token_ttl_secs || 600, // 10 minutes default
      refresh_token_ttl_secs: options?.refresh_token_ttl_secs || 3600, // 1 hour default
    })

    return response.data as ClientToken
  },

  /**
   * Refresh a client token
   */
  async refreshClientToken(
    roomId: string,
    refreshToken: string
  ): Promise<ClientToken> {
    const client = getTelnyxClient()

    const response = await (client as any).rooms.refreshClientToken(roomId, {
      refresh_token: refreshToken,
    })

    return response.data as ClientToken
  },
}

// ============================================
// ROOM SESSIONS API
// ============================================

export const MeetSessions = {
  /**
   * List sessions for a room
   */
  async list(
    roomId: string,
    filters?: {
      page?: number
      pageSize?: number
      active?: boolean
    }
  ): Promise<{ data: RoomSession[]; meta: any }> {
    const client = getTelnyxClient()

    const response = await (client as any).roomSessions.list({
      "filter[room_id]": roomId,
      "filter[active]": filters?.active,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize || 20,
    } as any)

    return {
      data: response.data as RoomSession[],
      meta: response.meta,
    }
  },

  /**
   * Get a specific session
   */
  async get(sessionId: string): Promise<RoomSession> {
    const client = getTelnyxClient()

    const response = await (client as any).roomSessions.retrieve(sessionId)
    return response.data as RoomSession
  },

  /**
   * End a session (kicks all participants)
   */
  async end(sessionId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomSessions.end(sessionId)
  },

  /**
   * Mute all participants in a session
   */
  async muteAll(sessionId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomSessions.mute(sessionId)
  },

  /**
   * Unmute all participants in a session
   */
  async unmuteAll(sessionId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomSessions.unmute(sessionId)
  },

  /**
   * Kick all participants from a session
   */
  async kickAll(sessionId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomSessions.kick(sessionId)
  },
}

// ============================================
// PARTICIPANTS API
// ============================================

export const MeetParticipants = {
  /**
   * List participants
   */
  async list(filters?: {
    roomId?: string
    sessionId?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: Participant[]; meta: any }> {
    const client = getTelnyxClient()

    const response = await (client as any).roomParticipants.list({
      "filter[room_id]": filters?.roomId,
      "filter[session_id]": filters?.sessionId,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize || 20,
    } as any)

    return {
      data: response.data as Participant[],
      meta: response.meta,
    }
  },

  /**
   * Get a specific participant
   */
  async get(participantId: string): Promise<Participant> {
    const client = getTelnyxClient()

    const response = await (client as any).roomParticipants.retrieve(participantId)
    return response.data as Participant
  },

  /**
   * Kick a participant from a session
   */
  async kick(participantId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomParticipants.kick(participantId)
  },

  /**
   * Mute a participant
   */
  async mute(participantId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomParticipants.mute(participantId)
  },

  /**
   * Unmute a participant
   */
  async unmute(participantId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomParticipants.unmute(participantId)
  },
}

// ============================================
// RECORDINGS API
// ============================================

export const MeetRecordings = {
  /**
   * List recordings
   */
  async list(filters?: {
    roomId?: string
    sessionId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: Recording[]; meta: any }> {
    const client = getTelnyxClient()

    const response = await (client as any).roomRecordings.list({
      "filter[room_id]": filters?.roomId,
      "filter[session_id]": filters?.sessionId,
      "filter[status]": filters?.status,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize || 20,
    } as any)

    return {
      data: response.data as Recording[],
      meta: response.meta,
    }
  },

  /**
   * Get a specific recording
   */
  async get(recordingId: string): Promise<Recording> {
    const client = getTelnyxClient()

    const response = await (client as any).roomRecordings.retrieve(recordingId)
    return response.data as Recording
  },

  /**
   * Delete a recording
   */
  async delete(recordingId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomRecordings.delete(recordingId)
  },

  /**
   * Delete multiple recordings
   */
  async deleteMany(recordingIds: string[]): Promise<void> {
    const client = getTelnyxClient()
    await Promise.all(
      recordingIds.map((id) => (client as any).roomRecordings.delete(id))
    )
  },
}

// ============================================
// COMPOSITIONS API
// ============================================

export const MeetCompositions = {
  /**
   * Create a composition from a session
   */
  async create(
    roomId: string,
    options: CreateCompositionOptions
  ): Promise<RoomComposition> {
    const client = getTelnyxClient()

    const response = await (client as any).roomCompositions.create({
      room_id: roomId,
      session_id: options.session_id,
      format: options.format || "mp4",
      resolution: options.resolution || "1280x720",
      video_layout: options.video_layout,
      webhook_event_url: options.webhook_event_url,
      webhook_event_failover_url: options.webhook_event_failover_url,
    } as any)

    return response.data as RoomComposition
  },

  /**
   * List compositions
   */
  async list(filters?: {
    roomId?: string
    sessionId?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: RoomComposition[]; meta: any }> {
    const client = getTelnyxClient()

    const response = await (client as any).roomCompositions.list({
      "filter[room_id]": filters?.roomId,
      "filter[session_id]": filters?.sessionId,
      "filter[status]": filters?.status,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize || 20,
    } as any)

    return {
      data: response.data as RoomComposition[],
      meta: response.meta,
    }
  },

  /**
   * Get a specific composition
   */
  async get(compositionId: string): Promise<RoomComposition> {
    const client = getTelnyxClient()

    const response = await (client as any).roomCompositions.retrieve(compositionId)
    return response.data as RoomComposition
  },

  /**
   * Delete a composition
   */
  async delete(compositionId: string): Promise<void> {
    const client = getTelnyxClient()
    await (client as any).roomCompositions.delete(compositionId)
  },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique room name
 */
export function generateRoomName(prefix: string = "meeting"): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Generate a meeting link
 */
export function generateMeetingLink(roomId: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${url}/meet/${roomId}`
}

/**
 * Parse meeting ID from URL
 */
export function parseMeetingId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const parts = urlObj.pathname.split("/")
    const meetIndex = parts.indexOf("meet")
    if (meetIndex >= 0 && parts[meetIndex + 1]) {
      return parts[meetIndex + 1]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Format duration in seconds to human readable format
 */
export function formatMeetingDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
