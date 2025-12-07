// ============================================
// KORE MEET - Type Definitions
// Telnyx Video API Types
// ============================================

// ============================================
// ROOM TYPES
// ============================================

export interface VideoRoom {
  id: string
  unique_name: string
  max_participants: number
  enable_recording: boolean
  webhook_event_url?: string
  webhook_event_failover_url?: string
  created_at: string
  updated_at: string
  active_session_id?: string
}

export interface CreateRoomOptions {
  unique_name: string
  max_participants?: number
  enable_recording?: boolean
  webhook_event_url?: string
  webhook_event_failover_url?: string
}

export interface UpdateRoomOptions {
  unique_name?: string
  max_participants?: number
  enable_recording?: boolean
  webhook_event_url?: string
  webhook_event_failover_url?: string
}

// ============================================
// TOKEN TYPES
// ============================================

export interface ClientToken {
  token: string
  token_expires_at: string
  refresh_token: string
  refresh_token_expires_at: string
}

export interface GenerateTokenOptions {
  token_ttl_secs?: number
  refresh_token_ttl_secs?: number
}

// ============================================
// PARTICIPANT TYPES
// ============================================

export interface Participant {
  id: string
  session_id: string
  room_id: string
  context?: string
  created_at: string
  updated_at: string
  joined_at?: string
  left_at?: string
}

export interface LocalParticipant {
  id: string
  context?: Record<string, any>
}

export interface RemoteParticipant {
  id: string
  context?: Record<string, any>
  streams: Map<string, Stream>
}

// ============================================
// STREAM TYPES
// ============================================

export interface Stream {
  key: string
  participantId: string
  audioTrack?: MediaStreamTrack
  videoTrack?: MediaStreamTrack
  audioEnabled: boolean
  videoEnabled: boolean
}

export interface AddStreamOptions {
  audio?: MediaStreamTrack | boolean
  video?: MediaStreamTrack | boolean
}

export interface SubscriptionOptions {
  audio?: boolean
  video?: boolean
}

// ============================================
// SESSION TYPES
// ============================================

export interface RoomSession {
  id: string
  room_id: string
  active: boolean
  created_at: string
  updated_at: string
  participant_count?: number
}

// ============================================
// RECORDING TYPES
// ============================================

export interface Recording {
  id: string
  room_id: string
  session_id: string
  status: "recording" | "completed" | "deleted"
  type: "audio" | "video"
  codec?: string
  duration_secs?: number
  size_mb?: number
  download_url?: string
  created_at: string
  completed_at?: string
}

export interface RoomComposition {
  id: string
  room_id: string
  session_id: string
  status: "enqueued" | "processing" | "completed" | "failed"
  format: "mp4" | "webm"
  resolution: string
  download_url?: string
  size_mb?: number
  duration_secs?: number
  created_at: string
  completed_at?: string
}

export interface CreateCompositionOptions {
  session_id: string
  format?: "mp4" | "webm"
  resolution?: "1280x720" | "1920x1080" | "640x480"
  video_layout?: Record<string, any>
  webhook_event_url?: string
  webhook_event_failover_url?: string
}

// ============================================
// ROOM STATE TYPES
// ============================================

export type RoomConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"

export interface RoomState {
  connectionState: RoomConnectionState
  localParticipant?: LocalParticipant
  remoteParticipants: Map<string, RemoteParticipant>
  streams: Map<string, Stream>
}

// ============================================
// EVENT TYPES
// ============================================

export type RoomEvent =
  | "state_changed"
  | "connected"
  | "disconnected"
  | "participant_joined"
  | "participant_leaving"
  | "participant_left"
  | "stream_published"
  | "stream_unpublished"
  | "track_enabled"
  | "track_disabled"
  | "track_censored"
  | "track_uncensored"
  | "audio_activity"
  | "subscription_started"
  | "subscription_reconfigured"
  | "subscription_ended"
  | "message_received"
  | "network_metrics_report"

export interface RoomEventHandlers {
  onConnected?: (state: RoomState) => void
  onDisconnected?: (state: RoomState) => void
  onParticipantJoined?: (participantId: string, state: RoomState) => void
  onParticipantLeft?: (participantId: string, state: RoomState) => void
  onStreamPublished?: (participantId: string, streamKey: string, state: RoomState) => void
  onStreamUnpublished?: (participantId: string, streamKey: string, state: RoomState) => void
  onTrackEnabled?: (participantId: string, streamKey: string, kind: "audio" | "video", state: RoomState) => void
  onTrackDisabled?: (participantId: string, streamKey: string, kind: "audio" | "video", state: RoomState) => void
  onMessageReceived?: (participantId: string, message: Message, state: RoomState) => void
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string
  type: string
  payload: any
  timestamp: string
}

export interface SendMessageOptions {
  type: string
  payload: any
  recipients?: string[] // participant IDs, null = broadcast
}

// ============================================
// NETWORK TYPES
// ============================================

export interface NetworkMetrics {
  participantId: string
  streamKey: string
  roundTripTime?: number
  jitter?: number
  packetLoss?: number
  bitrate?: number
  timestamp: string
}

// ============================================
// MEETING TYPES (Application-level)
// ============================================

export interface Meeting {
  id: string
  room_id: string
  organization_id: string
  title: string
  description?: string
  scheduled_start?: string
  scheduled_end?: string
  host_user_id: string
  is_recurring: boolean
  recurrence_rule?: string
  settings: MeetingSettings
  status: "scheduled" | "active" | "ended" | "cancelled"
  created_at: string
  updated_at: string
}

export interface MeetingSettings {
  waiting_room?: boolean
  mute_on_entry?: boolean
  video_off_on_entry?: boolean
  allow_screen_share?: boolean
  allow_recording?: boolean
  allow_chat?: boolean
  password?: string
  max_duration_mins?: number
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  user_id?: string
  name: string
  email?: string
  role: "host" | "co-host" | "participant" | "guest"
  joined_at?: string
  left_at?: string
  is_muted?: boolean
  is_video_off?: boolean
  is_screen_sharing?: boolean
}

export interface MeetingInvite {
  id: string
  meeting_id: string
  email: string
  name?: string
  role: "co-host" | "participant"
  status: "pending" | "accepted" | "declined"
  token: string
  created_at: string
  responded_at?: string
}

// ============================================
// WEBHOOK EVENT TYPES
// ============================================

export interface VideoWebhookEvent {
  event_type: string
  id: string
  occurred_at: string
  payload: {
    room_id?: string
    session_id?: string
    participant_id?: string
    recording_id?: string
    composition_id?: string
    [key: string]: any
  }
}

export type VideoWebhookEventType =
  | "video.room.session.started"
  | "video.room.session.ended"
  | "video.room.participant.joined"
  | "video.room.participant.left"
  | "video.room.recording.started"
  | "video.room.recording.ended"
  | "video.room.composition.completed"
  | "video.room.composition.failed"
