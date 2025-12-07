// ============================================
// TELNYX TYPES - KORE Voice Integration
// API-Only (No SIP/WebRTC)
// ============================================

// ============================================
// CONFIGURATION
// ============================================
export interface TelnyxConfig {
  apiKey: string
  connectionId?: string
  webhookUrl?: string
  defaultCallerId?: string
}

// ============================================
// CALL TYPES
// ============================================
export type CallDirection = "inbound" | "outbound"
export type CallState =
  | "parked"
  | "bridging"
  | "bridged"
  | "ringing"
  | "answered"
  | "hangup"

export type HangupCause =
  | "normal_clearing"
  | "originator_cancel"
  | "user_busy"
  | "no_answer"
  | "call_rejected"
  | "invalid_number_format"
  | "unallocated_number"

export interface TelnyxCall {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  is_alive: boolean
  record_type: "call"
  from: string
  to: string
  direction: CallDirection
  state: CallState
  start_time: string
  answer_time?: string
  end_time?: string
  hangup_cause?: HangupCause
  hangup_source?: string
  client_state?: string
  connection_id: string
}

export interface TelnyxCallLeg {
  call_leg_id: string
  call_session_id: string
  call_control_id: string
  status: CallState
  is_alive: boolean
  call_duration?: number
}

// ============================================
// CALL CONTROL COMMANDS
// ============================================
export interface DialRequest {
  to: string
  from: string
  connection_id: string
  webhook_url?: string
  webhook_url_method?: "GET" | "POST"
  answering_machine_detection?: "detect" | "detect_beep" | "detect_words" | "greeting_end" | "disabled"
  answering_machine_detection_config?: AnsweringMachineConfig
  custom_headers?: CustomHeader[]
  client_state?: string
  command_id?: string
  timeout_secs?: number
  time_limit_secs?: number
  audio_url?: string
  record?: "record-from-answer"
  record_channels?: "single" | "dual"
}

export interface AnsweringMachineConfig {
  after_greeting_silence_millis?: number
  between_words_silence_millis?: number
  greeting_duration_millis?: number
  greeting_total_analysis_time_millis?: number
  initial_silence_millis?: number
  maximum_number_of_words?: number
  maximum_word_length_millis?: number
  silence_threshold?: number
  total_analysis_time_millis?: number
}

export interface CustomHeader {
  name: string
  value: string
}

export interface AnswerRequest {
  call_control_id: string
  webhook_url?: string
  webhook_url_method?: "GET" | "POST"
  client_state?: string
  command_id?: string
  preferred_codecs?: string
}

export interface HangupRequest {
  call_control_id: string
  client_state?: string
  command_id?: string
}

export interface TransferRequest {
  call_control_id: string
  to: string
  from?: string
  audio_url?: string
  timeout_secs?: number
  time_limit_secs?: number
  answering_machine_detection?: string
  custom_headers?: CustomHeader[]
  webhook_url?: string
  webhook_url_method?: "GET" | "POST"
  client_state?: string
  command_id?: string
}

export interface BridgeRequest {
  call_control_id: string
  call_control_id_to_bridge: string
  client_state?: string
  command_id?: string
  park_after_unbridge?: string
}

// ============================================
// GATHER (DTMF & SPEECH)
// ============================================
export interface GatherRequest {
  call_control_id: string
  minimum_digits?: number
  maximum_digits?: number
  timeout_millis?: number
  inter_digit_timeout_millis?: number
  initial_timeout_millis?: number
  terminating_digit?: string
  valid_digits?: string
  client_state?: string
  command_id?: string
}

export interface GatherUsingAudioRequest extends GatherRequest {
  audio_url: string
  invalid_audio_url?: string
}

export interface GatherUsingSpeakRequest extends GatherRequest {
  payload: string
  payload_type?: "text" | "ssml"
  voice: string
  language?: string
  invalid_payload?: string
}

// ============================================
// AUDIO PLAYBACK
// ============================================
export interface PlaybackStartRequest {
  call_control_id: string
  audio_url: string
  loop?: number
  overlay?: boolean
  target_legs?: "self" | "opposite" | "both"
  client_state?: string
  command_id?: string
}

export interface PlaybackStopRequest {
  call_control_id: string
  client_state?: string
  command_id?: string
}

export interface SpeakRequest {
  call_control_id: string
  payload: string
  payload_type?: "text" | "ssml"
  voice: string
  language?: string
  client_state?: string
  command_id?: string
}

// ============================================
// RECORDING
// ============================================
export interface RecordingStartRequest {
  call_control_id: string
  format?: "mp3" | "wav"
  channels?: "single" | "dual"
  play_beep?: boolean
  client_state?: string
  command_id?: string
}

export interface RecordingStopRequest {
  call_control_id: string
  client_state?: string
  command_id?: string
}

export interface TelnyxRecording {
  id: string
  recording_id: string
  call_leg_id: string
  call_session_id: string
  channels: string
  conference_id?: string
  created_at: string
  download_urls: {
    mp3?: string
    wav?: string
  }
  duration_millis: number
  record_type: "recording"
  recording_ended_at: string
  recording_started_at: string
  source: string
  status: "completed" | "processing" | "deleted"
  transcription?: {
    text: string
    status: "completed" | "processing"
  }
}

// ============================================
// CONFERENCE
// ============================================
export interface ConferenceCreateRequest {
  call_control_id: string
  name: string
  beep_enabled?: "always" | "never" | "on_enter" | "on_exit"
  comfort_noise?: boolean
  duration_minutes?: number
  hold_audio_url?: string
  max_participants?: number
  start_conference_on_create?: boolean
  client_state?: string
  command_id?: string
}

export interface ConferenceJoinRequest {
  call_control_id: string
  conference_id: string
  hold?: boolean
  mute?: boolean
  start_conference_on_enter?: boolean
  supervisor_role?: "barge" | "whisper" | "none"
  end_conference_on_exit?: boolean
  soft_end_conference_on_exit?: boolean
  beep_enabled?: "always" | "never" | "on_enter" | "on_exit"
  client_state?: string
  command_id?: string
}

export interface TelnyxConference {
  id: string
  name: string
  record_type: "conference"
  created_at: string
  expires_at: string
  connection_id: string
  end_reason?: string
  ended_by?: {
    type: string
    id: string
  }
  region?: string
}

export interface ConferenceParticipant {
  id: string
  call_control_id: string
  call_leg_id: string
  conference_id: string
  whisper_call_control_ids: string[]
  status: "joining" | "joined" | "left"
  muted: boolean
  on_hold: boolean
  created_at: string
  updated_at: string
  end_conference_on_exit: boolean
  soft_end_conference_on_exit: boolean
}

// ============================================
// PHONE NUMBERS
// ============================================
export interface TelnyxPhoneNumber {
  id: string
  phone_number: string
  status: "active" | "deleted" | "port_pending" | "port_failed" | "emergency_only"
  connection_id?: string
  connection_name?: string
  billing_group_id?: string
  created_at: string
  updated_at: string
  purchased_at: string
  record_type: "phone_number"
  address_id?: string
  external_pin?: string
  tags?: string[]
  messaging_profile_id?: string
  number_level_routing?: "enabled" | "disabled"
  cnam_listing_enabled?: boolean
  caller_id_name_enabled?: boolean
  call_forwarding_enabled?: boolean
  call_recording_enabled?: boolean
  t38_fax_gateway_enabled?: boolean
  hd_voice_enabled?: boolean
}

export interface PhoneNumberSearchRequest {
  filter?: {
    phone_number?: {
      starts_with?: string
      ends_with?: string
      contains?: string
    }
    locality?: string
    administrative_area?: string
    country_code?: string
    national_destination_code?: string
    rate_center?: string
    number_type?: "local" | "toll_free" | "national"
    features?: ("sms" | "mms" | "voice" | "fax")[]
    best_effort?: boolean
    quickship?: boolean
    reservable?: boolean
  }
  page?: {
    number?: number
    size?: number
  }
}

export interface PhoneNumberOrderRequest {
  phone_numbers: { phone_number: string }[]
  connection_id?: string
  messaging_profile_id?: string
  billing_group_id?: string
  customer_reference?: string
}

// ============================================
// WEBHOOK EVENTS
// ============================================
export type TelnyxWebhookEventType =
  | "call.initiated"
  | "call.answered"
  | "call.bridged"
  | "call.hangup"
  | "call.machine.detection.ended"
  | "call.machine.greeting.ended"
  | "call.machine.premium.detection.ended"
  | "call.machine.premium.greeting.ended"
  | "call.recording.saved"
  | "call.recording.error"
  | "call.speak.started"
  | "call.speak.ended"
  | "call.playback.started"
  | "call.playback.ended"
  | "call.gather.ended"
  | "call.dtmf.received"
  | "call.refer.started"
  | "call.refer.completed"
  | "call.refer.failed"
  | "conference.created"
  | "conference.ended"
  | "conference.participant.joined"
  | "conference.participant.left"
  | "conference.participant.playback.started"
  | "conference.participant.playback.ended"
  | "conference.participant.speak.started"
  | "conference.participant.speak.ended"
  | "conference.recording.saved"
  | "streaming.started"
  | "streaming.stopped"
  | "streaming.failed"

export interface TelnyxWebhookEvent<T = unknown> {
  data: {
    event_type: TelnyxWebhookEventType
    id: string
    occurred_at: string
    payload: T
    record_type: "event"
  }
  meta: {
    attempt: number
    delivered_to: string
  }
}

export interface CallInitiatedPayload {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  client_state?: string
  connection_id: string
  direction: CallDirection
  from: string
  to: string
  state: CallState
  start_time: string
}

export interface CallAnsweredPayload extends CallInitiatedPayload {
  answer_time: string
}

export interface CallHangupPayload extends CallInitiatedPayload {
  end_time: string
  hangup_cause: HangupCause
  hangup_source: string
}

export interface GatherEndedPayload {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  client_state?: string
  connection_id: string
  digits: string
  from: string
  status: "valid" | "invalid" | "call_hangup"
  to: string
}

export interface DtmfReceivedPayload {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  client_state?: string
  connection_id: string
  digit: string
  from: string
  to: string
}

export interface RecordingSavedPayload {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  channels: "single" | "dual"
  client_state?: string
  connection_id: string
  public_recording_urls: {
    mp3?: string
    wav?: string
  }
  recording_ended_at: string
  recording_id: string
  recording_started_at: string
}

export interface MachineDetectionPayload {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  client_state?: string
  connection_id: string
  from: string
  result: "human" | "machine" | "not_sure"
  to: string
}

// ============================================
// API RESPONSES
// ============================================
export interface TelnyxApiResponse<T> {
  data: T
  meta?: {
    page_number?: number
    page_size?: number
    total_pages?: number
    total_results?: number
  }
}

export interface TelnyxApiError {
  code: string
  title: string
  detail: string
  source?: {
    pointer?: string
    parameter?: string
  }
  meta?: Record<string, unknown>
}

export interface TelnyxErrorResponse {
  errors: TelnyxApiError[]
}

// ============================================
// CALL LOG / HISTORY (for database storage)
// ============================================
export interface VoiceCallLog {
  id: string
  organization_id: string
  user_id?: string
  call_control_id: string
  call_session_id: string
  call_leg_id: string
  connection_id: string
  direction: CallDirection
  from_number: string
  to_number: string
  status: CallState
  hangup_cause?: HangupCause
  started_at: string
  answered_at?: string
  ended_at?: string
  duration_seconds?: number
  recording_url?: string
  transcription?: string
  notes?: string
  contact_id?: string
  account_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VoiceCallLogInsert extends Omit<VoiceCallLog, "id" | "created_at" | "updated_at"> {}
export interface VoiceCallLogUpdate extends Partial<VoiceCallLogInsert> {}
