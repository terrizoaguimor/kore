// ============================================
// TELNYX SERVER-SIDE API CLIENT
// KORE Voice Integration (API-Only, No SIP)
// ============================================

import Telnyx from "telnyx"

// ============================================
// TELNYX CLIENT SINGLETON
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
// CONFIGURATION
// ============================================
export function getTelnyxConfig() {
  return {
    connectionId: process.env.TELNYX_CONNECTION_ID || "",
    webhookUrl: process.env.TELNYX_WEBHOOK_URL || "",
    defaultCallerId: process.env.TELNYX_DEFAULT_CALLER_ID || "",
  }
}

// ============================================
// TYPES
// ============================================
export interface DialOptions {
  to: string
  from?: string
  connectionId?: string
  webhookUrl?: string
  answeringMachineDetection?: "premium" | "detect" | "detect_beep" | "detect_words" | "greeting_end" | "disabled"
  answeringMachineDetectionConfig?: {
    after_greeting_silence_millis?: number
    between_words_silence_millis?: number
    greeting_duration_millis?: number
    initial_silence_millis?: number
    maximum_word_length_millis?: number
    total_analysis_time_millis?: number
  }
  clientState?: string
  commandId?: string
  soundModifications?: {
    pitch?: number
    semitone?: number
    octaves?: number
    track?: string
  }
  streamUrl?: string
  streamTrack?: "inbound_track" | "outbound_track" | "both_tracks"
  timeoutSecs?: number
  timeLimitSecs?: number
  webhookUrlMethod?: "POST" | "GET"
}

export interface SpeakOptions {
  callControlId: string
  payload: string
  voice: string
  language?: string
  payloadType?: "text" | "ssml"
  serviceLevel?: "basic" | "premium"
  clientState?: string
  commandId?: string
}

export interface GatherOptions {
  callControlId: string
  minimumDigits?: number
  maximumDigits?: number
  maximumTries?: number
  timeoutMillis?: number
  terminatingDigit?: string
  validDigits?: string
  interDigitTimeoutMillis?: number
  clientState?: string
  commandId?: string
}

export interface GatherUsingSpeakOptions extends GatherOptions {
  payload: string
  voice: string
  language?: string
  payloadType?: "text" | "ssml"
}

export interface GatherUsingAudioOptions extends GatherOptions {
  audioUrl: string
}

export interface RecordOptions {
  callControlId: string
  channels: "single" | "dual"
  format: "mp3" | "wav"
  maxLength?: number
  timeoutSecs?: number
  playBeep?: boolean
  clientState?: string
  commandId?: string
}

export interface TransferOptions {
  callControlId: string
  to: string
  from?: string
  audioUrl?: string
  answeringMachineDetection?: string
  clientState?: string
  commandId?: string
  soundModifications?: object
  timeoutSecs?: number
  timeLimitSecs?: number
  webhookUrl?: string
  webhookUrlMethod?: "POST" | "GET"
}

export interface PlaybackOptions {
  callControlId: string
  audioUrl: string
  loop?: number
  overlay?: boolean
  targetLegs?: string
  clientState?: string
  commandId?: string
}

export interface ConferenceOptions {
  callControlId: string
  name: string
  beepEnabled?: "always" | "never" | "on_enter" | "on_exit"
  callControlIds?: string[]
  clientState?: string
  commandId?: string
  durationMinutes?: number
  holdAudioUrl?: string
  maxParticipants?: number
  mute?: boolean
  startConfOnCreate?: boolean
  supervisorRole?: "barge" | "monitor" | "none" | "whisper"
}

// ============================================
// CALL CONTROL API
// ============================================
export const TelnyxCalls = {
  /**
   * Initiate an outbound call via API
   */
  async dial(options: DialOptions) {
    const client = getTelnyxClient()
    const config = getTelnyxConfig()

    const response = await client.calls.dial({
      connection_id: options.connectionId || config.connectionId,
      to: options.to,
      from: options.from || config.defaultCallerId,
      webhook_url: options.webhookUrl || config.webhookUrl,
      answering_machine_detection: options.answeringMachineDetection,
      answering_machine_detection_config: options.answeringMachineDetectionConfig,
      client_state: options.clientState,
      command_id: options.commandId,
      sound_modifications: options.soundModifications,
      stream_url: options.streamUrl,
      stream_track: options.streamTrack,
      timeout_secs: options.timeoutSecs,
      time_limit_secs: options.timeLimitSecs,
      webhook_url_method: options.webhookUrlMethod,
    })

    return response.data
  },

  /**
   * Answer an incoming call
   */
  async answer(callControlId: string, options?: {
    billingGroupId?: string
    clientState?: string
    commandId?: string
    webhookUrl?: string
    webhookUrlMethod?: "POST" | "GET"
  }) {
    const client = getTelnyxClient()
    const config = getTelnyxConfig()

    const response = await client.calls.actions.answer(callControlId, {
      billing_group_id: options?.billingGroupId,
      client_state: options?.clientState,
      command_id: options?.commandId,
      webhook_url: options?.webhookUrl || config.webhookUrl,
      webhook_url_method: options?.webhookUrlMethod,
    })

    return response.data
  },

  /**
   * Hang up a call
   */
  async hangup(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.hangup(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * Reject an incoming call
   */
  async reject(callControlId: string, options?: {
    cause: "CALL_REJECTED" | "USER_BUSY"
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.reject(callControlId, {
      cause: options?.cause || "CALL_REJECTED",
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * Transfer a call to another destination
   */
  async transfer(options: TransferOptions) {
    const client = getTelnyxClient()
    const config = getTelnyxConfig()

    const response = await client.calls.actions.transfer(options.callControlId, {
      to: options.to,
      from: options.from || config.defaultCallerId,
      audio_url: options.audioUrl,
      answering_machine_detection: options.answeringMachineDetection as any,
      client_state: options.clientState,
      command_id: options.commandId,
      sound_modifications: options.soundModifications as any,
      timeout_secs: options.timeoutSecs,
      time_limit_secs: options.timeLimitSecs,
      webhook_url: options.webhookUrl || config.webhookUrl,
      webhook_url_method: options.webhookUrlMethod,
    })

    return response.data
  },

  /**
   * Bridge two calls together
   */
  async bridge(callControlId: string, targetCallControlId: string, options?: {
    clientState?: string
    commandId?: string
    parkAfterUnbridge?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.bridge(callControlId, {
      call_control_id: targetCallControlId,
      client_state: options?.clientState,
      command_id: options?.commandId,
      park_after_unbridge: options?.parkAfterUnbridge,
    })

    return response.data
  },

  /**
   * Get call information
   */
  async get(callControlId: string) {
    const client = getTelnyxClient()
    const response = await client.calls.retrieveStatus(callControlId)
    return response.data
  },
}

// ============================================
// SPEAK (TEXT-TO-SPEECH) API
// ============================================
export const TelnyxSpeak = {
  /**
   * Speak text to a call using TTS
   */
  async speak(options: SpeakOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.speak(options.callControlId, {
      payload: options.payload,
      voice: options.voice,
      language: (options.language || "en-US") as any,
      payload_type: options.payloadType || "text",
      service_level: options.serviceLevel,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Stop speaking
   */
  async stop(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.stopPlayback(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },
}

// ============================================
// GATHER (DTMF INPUT) API
// ============================================
export const TelnyxGather = {
  /**
   * Gather DTMF digits
   */
  async gather(options: GatherOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.gather(options.callControlId, {
      minimum_digits: options.minimumDigits || 1,
      maximum_digits: options.maximumDigits || 128,
      timeout_millis: options.timeoutMillis || 60000,
      terminating_digit: options.terminatingDigit || "#",
      valid_digits: options.validDigits || "0123456789*#",
      inter_digit_timeout_millis: options.interDigitTimeoutMillis || 5000,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Gather DTMF while speaking TTS
   */
  async gatherUsingSpeak(options: GatherUsingSpeakOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.gatherUsingSpeak(options.callControlId, {
      payload: options.payload,
      voice: options.voice,
      language: (options.language || "en-US") as any,
      payload_type: options.payloadType || "text",
      minimum_digits: options.minimumDigits || 1,
      maximum_digits: options.maximumDigits || 128,
      timeout_millis: options.timeoutMillis || 60000,
      terminating_digit: options.terminatingDigit || "#",
      valid_digits: options.validDigits || "0123456789*#",
      inter_digit_timeout_millis: options.interDigitTimeoutMillis || 5000,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Gather DTMF while playing audio
   */
  async gatherUsingAudio(options: GatherUsingAudioOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.gatherUsingAudio(options.callControlId, {
      audio_url: options.audioUrl,
      minimum_digits: options.minimumDigits || 1,
      maximum_digits: options.maximumDigits || 128,
      timeout_millis: options.timeoutMillis || 60000,
      terminating_digit: options.terminatingDigit || "#",
      valid_digits: options.validDigits || "0123456789*#",
      inter_digit_timeout_millis: options.interDigitTimeoutMillis || 5000,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Stop gathering
   */
  async stop(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.stopGather(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * Send DTMF tones
   */
  async sendDtmf(callControlId: string, digits: string, options?: {
    durationMillis?: number
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.sendDtmf(callControlId, {
      digits,
      duration_millis: options?.durationMillis || 250,
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },
}

// ============================================
// AUDIO PLAYBACK API
// ============================================
export const TelnyxAudio = {
  /**
   * Play audio from URL
   */
  async play(options: PlaybackOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.startPlayback(options.callControlId, {
      audio_url: options.audioUrl,
      loop: options.loop as any,
      overlay: options.overlay,
      target_legs: options.targetLegs as any,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Stop audio playback
   */
  async stop(callControlId: string, options?: {
    clientState?: string
    commandId?: string
    stop?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.stopPlayback(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
      stop: options?.stop as any,
    })

    return response.data
  },
}

// ============================================
// RECORDING API
// ============================================
export const TelnyxRecording = {
  /**
   * Start recording a call
   */
  async start(options: RecordOptions) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.startRecording(options.callControlId, {
      channels: options.channels,
      format: options.format,
      max_length: options.maxLength,
      timeout_secs: options.timeoutSecs,
      play_beep: options.playBeep,
      client_state: options.clientState,
      command_id: options.commandId,
    })

    return response.data
  },

  /**
   * Stop recording
   */
  async stop(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.stopRecording(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * Pause recording
   */
  async pause(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.pauseRecording(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * Resume recording
   */
  async resume(callControlId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.calls.actions.resumeRecording(callControlId, {
      client_state: options?.clientState,
      command_id: options?.commandId,
    })

    return response.data
  },

  /**
   * List recordings
   */
  async list(filters?: {
    connectionId?: string
    conferenceId?: string
    page?: number
    pageSize?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.recordings.list({
      filter: {
        connection_id: filters?.connectionId,
        conference_id: filters?.conferenceId,
      },
      page: {
        number: filters?.page,
        size: filters?.pageSize,
      },
    })

    return response.data
  },

  /**
   * Get a specific recording
   */
  async get(recordingId: string) {
    const client = getTelnyxClient()
    const response = await client.recordings.retrieve(recordingId)
    return response.data
  },

  /**
   * Delete a recording
   */
  async delete(recordingId: string) {
    const client = getTelnyxClient()
    await client.recordings.delete(recordingId)
  },
}

// ============================================
// CONFERENCE API
// ============================================
export const TelnyxConference = {
  /**
   * List all conferences
   */
  async list(filters?: {
    name?: string
    status?: string
    page?: number
    pageSize?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.list({
      filter: {
        name: filters?.name,
        status: filters?.status,
      },
      page: {
        number: filters?.page,
        size: filters?.pageSize,
      },
    } as any)

    return response.data
  },

  /**
   * Get conference details
   */
  async get(conferenceId: string) {
    const client = getTelnyxClient()
    const response = await client.conferences.retrieve(conferenceId)
    return response.data
  },

  /**
   * List conference participants
   */
  async listParticipants(conferenceId: string, filters?: {
    muted?: boolean
    onHold?: boolean
    whispering?: boolean
    page?: number
    pageSize?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.listParticipants(conferenceId, {
      filter: {
        muted: filters?.muted,
        on_hold: filters?.onHold,
        whispering: filters?.whispering,
      },
      page: {
        number: filters?.page,
        size: filters?.pageSize,
      },
    } as any)

    return response.data
  },

  /**
   * Join a call to an existing conference
   */
  async join(conferenceId: string, callControlId: string, options?: {
    beepEnabled?: "always" | "never" | "on_enter" | "on_exit"
    clientState?: string
    commandId?: string
    endConferenceOnExit?: boolean
    hold?: boolean
    holdAudioUrl?: string
    mute?: boolean
    softEndConferenceOnExit?: boolean
    startConferenceOnEnter?: boolean
    supervisorRole?: "barge" | "monitor" | "none" | "whisper"
    whisperCallControlIds?: string[]
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.join(conferenceId, {
      call_control_id: callControlId,
      beep_enabled: options?.beepEnabled,
      client_state: options?.clientState,
      command_id: options?.commandId,
      end_conference_on_exit: options?.endConferenceOnExit,
      hold: options?.hold,
      hold_audio_url: options?.holdAudioUrl,
      mute: options?.mute,
      soft_end_conference_on_exit: options?.softEndConferenceOnExit,
      start_conference_on_enter: options?.startConferenceOnEnter,
      supervisor_role: options?.supervisorRole,
      whisper_call_control_ids: options?.whisperCallControlIds,
    })

    return response.data
  },

  /**
   * Mute participants
   */
  async mute(conferenceId: string, callControlIds?: string[]) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.mute(conferenceId, {
      call_control_ids: callControlIds,
    })

    return response.data
  },

  /**
   * Unmute participants
   */
  async unmute(conferenceId: string, callControlIds?: string[]) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.unmute(conferenceId, {
      call_control_ids: callControlIds,
    })

    return response.data
  },

  /**
   * Hold participants
   */
  async hold(conferenceId: string, callControlIds?: string[], audioUrl?: string) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.hold(conferenceId, {
      call_control_ids: callControlIds,
      audio_url: audioUrl,
    })

    return response.data
  },

  /**
   * Unhold participants
   */
  async unhold(conferenceId: string, callControlIds?: string[]) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.unhold(conferenceId, {
      call_control_ids: callControlIds || [],
    })

    return response.data
  },

  /**
   * Speak to conference
   */
  async speak(conferenceId: string, payload: string, voice: string, options?: {
    language?: string
    callControlIds?: string[]
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.speak(conferenceId, {
      payload,
      voice,
      language: (options?.language || "en-US") as any,
      call_control_ids: options?.callControlIds,
    } as any)

    return response.data
  },

  /**
   * Play audio to conference
   */
  async playAudio(conferenceId: string, audioUrl: string, options?: {
    loop?: number
    callControlIds?: string[]
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.play(conferenceId, {
      audio_url: audioUrl,
      loop: options?.loop,
      call_control_ids: options?.callControlIds,
    } as any)

    return response.data
  },

  /**
   * Stop audio in conference
   */
  async stopAudio(conferenceId: string, callControlIds?: string[]) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.stop(conferenceId, {
      call_control_ids: callControlIds,
    })

    return response.data
  },

  /**
   * Start conference recording
   */
  async startRecording(conferenceId: string, options?: {
    channels?: "single" | "dual"
    format?: "mp3" | "wav"
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.recordStart(conferenceId, {
      channels: options?.channels || "single",
      format: options?.format || "mp3",
    } as any)

    return response.data
  },

  /**
   * Stop conference recording
   */
  async stopRecording(conferenceId: string, options?: {
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.recordStop(conferenceId, {} as any)

    return response.data
  },

  /**
   * Leave conference
   */
  async leave(conferenceId: string, callControlId: string, options?: {
    beepEnabled?: "always" | "never" | "on_enter" | "on_exit"
    clientState?: string
    commandId?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.conferences.actions.leave(conferenceId, {
      call_control_id: callControlId,
      beep_enabled: options?.beepEnabled,
    } as any)

    return response.data
  },
}

// ============================================
// PHONE NUMBERS API
// ============================================
export const TelnyxNumbers = {
  /**
   * Search available phone numbers
   */
  async search(filters: {
    countryCode?: string
    administrativeArea?: string
    locality?: string
    nationalDestinationCode?: string
    startsWith?: string
    endsWith?: string
    contains?: string
    numberType?: "local" | "toll_free" | "national"
    features?: string[]
    limit?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.availablePhoneNumbers.list({
      "filter[country_code]": filters.countryCode || "US",
      "filter[administrative_area]": filters.administrativeArea,
      "filter[locality]": filters.locality,
      "filter[national_destination_code]": filters.nationalDestinationCode,
      "filter[phone_number][starts_with]": filters.startsWith,
      "filter[phone_number][ends_with]": filters.endsWith,
      "filter[phone_number][contains]": filters.contains,
      "filter[phone_number_type]": filters.numberType,
      "filter[features]": filters.features,
      "filter[limit]": filters.limit || 10,
    } as any)

    return response.data
  },

  /**
   * Order phone numbers
   */
  async order(phoneNumbers: string[], connectionId?: string) {
    const client = getTelnyxClient()
    const config = getTelnyxConfig()

    const response = await client.numberOrders.create({
      phone_numbers: phoneNumbers.map(pn => ({ phone_number: pn })),
      connection_id: connectionId || config.connectionId,
    })

    return response.data
  },

  /**
   * List purchased phone numbers
   */
  async list(filters?: {
    status?: string
    connectionId?: string
    tag?: string
    page?: number
    pageSize?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.phoneNumbers.list({
      "filter[status]": filters?.status,
      "filter[connection_id]": filters?.connectionId,
      "filter[tag]": filters?.tag,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize,
    } as any)

    return response.data
  },

  /**
   * Get phone number details
   */
  async get(phoneNumberId: string) {
    const client = getTelnyxClient()
    const response = await client.phoneNumbers.retrieve(phoneNumberId)
    return response.data
  },

  /**
   * Update phone number
   */
  async update(phoneNumberId: string, updates: {
    connectionId?: string
    tags?: string[]
    externalPin?: string
    customerReference?: string
  }) {
    const client = getTelnyxClient()

    const response = await client.phoneNumbers.update(phoneNumberId, {
      connection_id: updates.connectionId,
      tags: updates.tags,
      external_pin: updates.externalPin,
      customer_reference: updates.customerReference,
    })

    return response.data
  },

  /**
   * Delete/release a phone number
   */
  async delete(phoneNumberId: string) {
    const client = getTelnyxClient()
    await (client.phoneNumbers as any).delete(phoneNumberId)
  },
}

// ============================================
// CALL CONTROL APPLICATIONS API
// ============================================
export const TelnyxApplications = {
  /**
   * List call control applications
   */
  async list(filters?: {
    name?: string
    outboundVoiceProfileId?: string
    page?: number
    pageSize?: number
  }) {
    const client = getTelnyxClient()

    const response = await client.callControlApplications.list({
      "filter[application_name][contains]": filters?.name,
      "filter[outbound_voice_profile_id]": filters?.outboundVoiceProfileId,
      "page[number]": filters?.page,
      "page[size]": filters?.pageSize,
    } as any)

    return response.data
  },

  /**
   * Get application details
   */
  async get(applicationId: string) {
    const client = getTelnyxClient()
    const response = await client.callControlApplications.retrieve(applicationId)
    return response.data
  },

  /**
   * Create a new call control application
   */
  async create(options: {
    name: string
    webhookUrl: string
    webhookUrlMethod?: "POST" | "GET"
    webhookTimeoutSecs?: number
    webhookFailoverUrl?: string
    firstCommandTimeout?: boolean
    firstCommandTimeoutSecs?: number
    active?: boolean
    anchorSiteOverride?: string
    dtmfType?: "RFC 2833" | "Inband" | "SIP INFO"
    inbound?: object
    outbound?: object
  }) {
    const client = getTelnyxClient()

    const response = await client.callControlApplications.create({
      application_name: options.name,
      webhook_event_url: options.webhookUrl,
      webhook_event_method: options.webhookUrlMethod || "POST",
      webhook_timeout_secs: options.webhookTimeoutSecs || 25,
      webhook_event_failover_url: options.webhookFailoverUrl,
      first_command_timeout: options.firstCommandTimeout,
      first_command_timeout_secs: options.firstCommandTimeoutSecs,
      active: options.active ?? true,
      anchorsite_override: options.anchorSiteOverride,
      dtmf_type: options.dtmfType || "RFC 2833",
      inbound: options.inbound,
      outbound: options.outbound,
    } as any)

    return response.data
  },

  /**
   * Update an application
   */
  async update(applicationId: string, updates: {
    name?: string
    webhookUrl?: string
    webhookUrlMethod?: "POST" | "GET"
    webhookTimeoutSecs?: number
    webhookFailoverUrl?: string
    active?: boolean
  }) {
    const client = getTelnyxClient()

    const response = await client.callControlApplications.update(applicationId, {
      application_name: updates.name,
      webhook_event_url: updates.webhookUrl,
      webhook_event_method: updates.webhookUrlMethod,
      webhook_timeout_secs: updates.webhookTimeoutSecs,
      webhook_event_failover_url: updates.webhookFailoverUrl,
      active: updates.active,
    } as any)

    return response.data
  },

  /**
   * Delete an application
   */
  async delete(applicationId: string) {
    const client = getTelnyxClient()
    await (client.callControlApplications as any).delete(applicationId)
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(number: string): string {
  const digits = number.replace(/\D/g, "")

  // US/CA format
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // 10 digit US format
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // International format
  if (digits.length > 10) {
    return `+${digits}`
  }

  return number
}

/**
 * Parse a phone number to E.164 format
 */
export function toE164(number: string, defaultCountryCode: string = "1"): string {
  const digits = number.replace(/\D/g, "")

  // Already has country code
  if (digits.length === 11 && digits[0] === "1") {
    return `+${digits}`
  }

  // Add country code
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`
  }

  // Assume already formatted
  if (digits.length > 10) {
    return `+${digits}`
  }

  return number
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(number: string): boolean {
  const digits = number.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 15
}

/**
 * Format call duration
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

// ============================================
// EXPORT ALL
// ============================================
export const TelnyxServer = {
  Calls: TelnyxCalls,
  Speak: TelnyxSpeak,
  Gather: TelnyxGather,
  Audio: TelnyxAudio,
  Recording: TelnyxRecording,
  Conference: TelnyxConference,
  Numbers: TelnyxNumbers,
  Applications: TelnyxApplications,
}

export default TelnyxServer
