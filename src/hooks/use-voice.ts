"use client"

// ============================================
// VOICE HOOKS - KORE Voice UI
// API-Only Integration (No SIP/WebRTC)
// ============================================

import { useState, useEffect, useCallback, useRef } from "react"
import { formatPhoneNumber, formatDuration, toE164 } from "@/lib/telnyx/server"
import type { CallDirection, VoiceCallLog } from "@/types/telnyx"

// ============================================
// CALL HISTORY HOOK
// For fetching and managing call logs
// ============================================
export function useCallHistory(organizationId?: string) {
  const [calls, setCalls] = useState<VoiceCallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalls = useCallback(
    async (filters?: {
      direction?: CallDirection
      startDate?: string
      endDate?: string
      page?: number
      limit?: number
    }) => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set("organizationId", organizationId)
        if (filters?.direction) params.set("direction", filters.direction)
        if (filters?.startDate) params.set("startDate", filters.startDate)
        if (filters?.endDate) params.set("endDate", filters.endDate)
        if (filters?.page) params.set("page", String(filters.page))
        if (filters?.limit) params.set("limit", String(filters.limit))

        const response = await fetch(`/api/voice/history?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setCalls(data.data)
        } else {
          setError(data.error)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  useEffect(() => {
    if (organizationId) {
      fetchCalls()
    }
  }, [organizationId, fetchCalls])

  return {
    calls,
    loading,
    error,
    fetchCalls,
  }
}

// ============================================
// PHONE NUMBERS HOOK
// For managing phone numbers
// ============================================
export function usePhoneNumbers() {
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNumbers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/voice/numbers")
      const data = await response.json()

      if (data.success) {
        setNumbers(data.data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchNumbers = useCallback(
    async (filters: {
      areaCode?: string
      city?: string
      state?: string
      country?: string
      type?: "local" | "toll_free" | "national"
    }) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters.areaCode) params.set("areaCode", filters.areaCode)
        if (filters.city) params.set("city", filters.city)
        if (filters.state) params.set("state", filters.state)
        if (filters.country) params.set("country", filters.country)
        if (filters.type) params.set("type", filters.type)

        const response = await fetch(`/api/voice/numbers/search?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          return data.data
        } else {
          setError(data.error)
          return []
        }
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const orderNumber = useCallback(async (phoneNumber: string) => {
    try {
      const response = await fetch("/api/voice/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchNumbers()
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchNumbers])

  const releaseNumber = useCallback(async (numberId: string) => {
    try {
      const response = await fetch(`/api/voice/numbers/${numberId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await fetchNumbers()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchNumbers])

  useEffect(() => {
    fetchNumbers()
  }, [fetchNumbers])

  return {
    numbers,
    loading,
    error,
    fetchNumbers,
    searchNumbers,
    orderNumber,
    releaseNumber,
  }
}

// ============================================
// ACTIVE CALLS HOOK
// For monitoring and controlling active calls via API
// ============================================
export interface ActiveCall {
  callControlId: string
  callLegId: string
  callSessionId: string
  direction: CallDirection
  from: string
  to: string
  state: string
  startTime: Date
  answerTime?: Date
}

export function useActiveCalls() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveCalls = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/voice/calls")
      const data = await response.json()

      if (data.success) {
        setActiveCalls(data.data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Initiate an outbound call via API
   * This will call from your Telnyx number to the destination
   */
  const initiateCall = useCallback(
    async (to: string, from: string, options?: {
      answeringMachineDetection?: "detect" | "detect_beep" | "detect_words" | "greeting_end" | "disabled"
      timeoutSecs?: number
      timeLimitSecs?: number
    }) => {
      try {
        const response = await fetch("/api/voice/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: toE164(to),
            from: toE164(from),
            ...options,
          }),
        })

        const data = await response.json()

        if (data.success) {
          await fetchActiveCalls()
          return data.data
        } else {
          throw new Error(data.error)
        }
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [fetchActiveCalls]
  )

  /**
   * Send a command to control an active call
   */
  const controlCall = useCallback(
    async (callControlId: string, action: string, params?: Record<string, any>) => {
      try {
        const response = await fetch(`/api/voice/calls/${callControlId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...params }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error)
        }

        await fetchActiveCalls()
        return data.data
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [fetchActiveCalls]
  )

  /**
   * Answer an incoming call
   */
  const answerCall = useCallback(
    async (callControlId: string) => {
      return controlCall(callControlId, "answer")
    },
    [controlCall]
  )

  /**
   * Hang up a call
   */
  const hangupCall = useCallback(
    async (callControlId: string) => {
      return controlCall(callControlId, "hangup")
    },
    [controlCall]
  )

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(
    async (callControlId: string, cause?: "call_rejected" | "user_busy") => {
      return controlCall(callControlId, "reject", { cause })
    },
    [controlCall]
  )

  /**
   * Transfer a call to another destination
   */
  const transferCall = useCallback(
    async (callControlId: string, to: string) => {
      return controlCall(callControlId, "transfer", { to: toE164(to) })
    },
    [controlCall]
  )

  /**
   * Bridge two calls together
   */
  const bridgeCalls = useCallback(
    async (callControlId: string, targetCallControlId: string) => {
      return controlCall(callControlId, "bridge", { targetCallControlId })
    },
    [controlCall]
  )

  /**
   * Speak text to the call using TTS
   */
  const speakToCall = useCallback(
    async (callControlId: string, text: string, voice?: string, language?: string) => {
      return controlCall(callControlId, "speak", {
        payload: text,
        voice: voice || "female",
        language: language || "en-US"
      })
    },
    [controlCall]
  )

  /**
   * Play audio to the call
   */
  const playAudio = useCallback(
    async (callControlId: string, audioUrl: string, loop?: number) => {
      return controlCall(callControlId, "playAudio", { audioUrl, loop })
    },
    [controlCall]
  )

  /**
   * Start recording the call
   */
  const startRecording = useCallback(
    async (callControlId: string, options?: { channels?: "single" | "dual"; format?: "mp3" | "wav" }) => {
      return controlCall(callControlId, "recordStart", options)
    },
    [controlCall]
  )

  /**
   * Stop recording the call
   */
  const stopRecording = useCallback(
    async (callControlId: string) => {
      return controlCall(callControlId, "recordStop")
    },
    [controlCall]
  )

  /**
   * Gather DTMF input from caller
   */
  const gatherDtmf = useCallback(
    async (callControlId: string, options?: {
      minimumDigits?: number
      maximumDigits?: number
      timeoutMillis?: number
      terminatingDigit?: string
    }) => {
      return controlCall(callControlId, "gather", options)
    },
    [controlCall]
  )

  /**
   * Gather DTMF while speaking prompt
   */
  const gatherWithSpeak = useCallback(
    async (callControlId: string, prompt: string, options?: {
      voice?: string
      language?: string
      minimumDigits?: number
      maximumDigits?: number
      timeoutMillis?: number
      terminatingDigit?: string
    }) => {
      return controlCall(callControlId, "gatherUsingSpeak", {
        payload: prompt,
        voice: options?.voice || "female",
        language: options?.language || "en-US",
        ...options
      })
    },
    [controlCall]
  )

  /**
   * Send DTMF tones
   */
  const sendDtmf = useCallback(
    async (callControlId: string, digits: string) => {
      return controlCall(callControlId, "sendDtmf", { digits })
    },
    [controlCall]
  )

  return {
    activeCalls,
    loading,
    error,
    fetchActiveCalls,
    initiateCall,
    controlCall,
    answerCall,
    hangupCall,
    rejectCall,
    transferCall,
    bridgeCalls,
    speakToCall,
    playAudio,
    startRecording,
    stopRecording,
    gatherDtmf,
    gatherWithSpeak,
    sendDtmf,
  }
}

// ============================================
// CALL TIMER HOOK
// For tracking call duration
// ============================================
export function useCallTimer(isActive: boolean, startTime?: Date) {
  const [duration, setDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && startTime) {
      // Calculate initial duration
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
      setDuration(elapsed)

      // Update every second
      intervalRef.current = setInterval(() => {
        const now = Math.floor((Date.now() - startTime.getTime()) / 1000)
        setDuration(now)
      }, 1000)
    } else {
      // Clear timer when call ends
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!isActive) {
        setDuration(0)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, startTime])

  return {
    duration,
    formatted: formatDuration(duration),
  }
}

// ============================================
// VOICE SETTINGS HOOK
// For managing voice configuration
// ============================================
export function useVoiceSettings() {
  const [settings, setSettings] = useState<{
    defaultCallerId?: string
    recordAllCalls?: boolean
    transcribeRecordings?: boolean
    answeringMachineDetection?: string
    voicemailEnabled?: boolean
    voicemailGreeting?: string
  }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/voice/settings")
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (updates: Partial<typeof settings>) => {
    try {
      const response = await fetch("/api/voice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(prev => ({ ...prev, ...updates }))
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  }
}

// ============================================
// RECORDINGS HOOK
// For managing call recordings
// ============================================
export function useRecordings(organizationId?: string) {
  const [recordings, setRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecordings = useCallback(async (filters?: {
    callControlId?: string
    page?: number
    limit?: number
  }) => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("organizationId", organizationId)
      if (filters?.callControlId) params.set("callControlId", filters.callControlId)
      if (filters?.page) params.set("page", String(filters.page))
      if (filters?.limit) params.set("limit", String(filters.limit))

      const response = await fetch(`/api/voice/recordings?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setRecordings(data.data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const deleteRecording = useCallback(async (recordingId: string) => {
    try {
      const response = await fetch(`/api/voice/recordings/${recordingId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setRecordings(prev => prev.filter(r => r.id !== recordingId))
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  useEffect(() => {
    if (organizationId) {
      fetchRecordings()
    }
  }, [organizationId, fetchRecordings])

  return {
    recordings,
    loading,
    error,
    fetchRecordings,
    deleteRecording,
  }
}

// Re-export utilities for convenience
export { formatPhoneNumber, formatDuration, toE164 }
