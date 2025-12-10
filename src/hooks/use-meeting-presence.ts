"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Participant {
  id: string
  user_id: string | null
  display_name: string
  status: "waiting" | "in_meeting" | "disconnected"
  joined_at: string
  last_seen_at: string
  metadata: Record<string, unknown>
}

interface WaitingEntry {
  id: string
  user_id: string | null
  display_name: string
  email: string | null
  status: "waiting" | "admitted" | "rejected"
  requested_at: string
  user?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface UseMeetingPresenceOptions {
  roomId: string
  enabled?: boolean
  heartbeatInterval?: number // in ms, default 30000
}

export function useMeetingPresence({
  roomId,
  enabled = true,
  heartbeatInterval = 30000,
}: UseMeetingPresenceOptions) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [waitingRoom, setWaitingRoom] = useState<WaitingEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [myStatus, setMyStatus] = useState<"waiting" | "in_meeting" | "disconnected" | null>(null)

  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch current participants
  const fetchParticipants = useCallback(async () => {
    if (!roomId) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("meeting_presence")
        .select("*")
        .eq("room_id", roomId)
        .in("status", ["waiting", "in_meeting"])

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error("[useMeetingPresence] Error fetching participants:", error)
    }
  }, [roomId, supabase])

  // Fetch waiting room
  const fetchWaitingRoom = useCallback(async () => {
    if (!roomId) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("waiting_room")
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .eq("status", "waiting")
        .order("requested_at", { ascending: true })

      if (error) throw error
      setWaitingRoom(data || [])
    } catch (error) {
      console.error("[useMeetingPresence] Error fetching waiting room:", error)
    }
  }, [roomId, supabase])

  // Send heartbeat to keep presence alive
  const sendHeartbeat = useCallback(async () => {
    if (!roomId) return

    try {
      await fetch(`/api/meet/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat" }),
      })
    } catch (error) {
      console.error("[useMeetingPresence] Heartbeat error:", error)
    }
  }, [roomId])

  // Join meeting (update presence to in_meeting)
  const joinMeeting = useCallback(async (displayName?: string) => {
    if (!roomId) return false

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "joinMeeting", display_name: displayName }),
      })

      const result = await response.json()
      if (result.success) {
        setMyStatus("in_meeting")
        return true
      }
      return false
    } catch (error) {
      console.error("[useMeetingPresence] Join error:", error)
      return false
    }
  }, [roomId])

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    if (!roomId) return

    try {
      await fetch(`/api/meet/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leaveMeeting" }),
      })
      setMyStatus("disconnected")
    } catch (error) {
      console.error("[useMeetingPresence] Leave error:", error)
    }
  }, [roomId])

  // Waiting room actions
  const joinWaitingRoom = useCallback(async (displayName?: string) => {
    if (!roomId) return null

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}/waiting-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", displayName }),
      })

      const result = await response.json()
      if (result.success) {
        setMyStatus("waiting")
        return result.data
      }
      return null
    } catch (error) {
      console.error("[useMeetingPresence] Join waiting room error:", error)
      return null
    }
  }, [roomId])

  const checkWaitingStatus = useCallback(async () => {
    if (!roomId) return null

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}/waiting-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkStatus" }),
      })

      const result = await response.json()
      return result.data?.status || null
    } catch (error) {
      console.error("[useMeetingPresence] Check status error:", error)
      return null
    }
  }, [roomId])

  const admitParticipant = useCallback(async (userId: string) => {
    if (!roomId) return false

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}/waiting-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admit", targetUserId: userId }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("[useMeetingPresence] Admit error:", error)
      return false
    }
  }, [roomId])

  const admitAll = useCallback(async () => {
    if (!roomId) return false

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}/waiting-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admitAll" }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("[useMeetingPresence] Admit all error:", error)
      return false
    }
  }, [roomId])

  const rejectParticipant = useCallback(async (userId: string) => {
    if (!roomId) return false

    try {
      const response = await fetch(`/api/meet/rooms/${roomId}/waiting-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", targetUserId: userId }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("[useMeetingPresence] Reject error:", error)
      return false
    }
  }, [roomId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !roomId) return

    // Initial fetch
    fetchParticipants()
    fetchWaitingRoom()

    // Subscribe to presence changes
    const channel = supabase
      .channel(`meeting:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_presence",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("[useMeetingPresence] Presence change:", payload.eventType)

          if (payload.eventType === "INSERT") {
            setParticipants((prev) => {
              const exists = prev.some((p) => p.id === payload.new.id)
              if (exists) return prev
              return [...prev, payload.new as Participant]
            })
          } else if (payload.eventType === "UPDATE") {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Participant) : p
              )
            )
          } else if (payload.eventType === "DELETE") {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            )
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiting_room",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("[useMeetingPresence] Waiting room change:", payload.eventType)
          // Refetch waiting room to get user details
          fetchWaitingRoom()
        }
      )
      .subscribe((status) => {
        console.log("[useMeetingPresence] Channel status:", status)
        setIsConnected(status === "SUBSCRIBED")
      })

    channelRef.current = channel

    // Start heartbeat
    heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval)

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }
  }, [
    enabled,
    roomId,
    supabase,
    fetchParticipants,
    fetchWaitingRoom,
    sendHeartbeat,
    heartbeatInterval,
  ])

  // Cleanup on unmount - leave meeting
  useEffect(() => {
    return () => {
      if (myStatus === "in_meeting") {
        leaveMeeting()
      }
    }
  }, [myStatus, leaveMeeting])

  return {
    // State
    participants,
    waitingRoom,
    isConnected,
    myStatus,

    // Actions
    joinMeeting,
    leaveMeeting,
    joinWaitingRoom,
    checkWaitingStatus,
    admitParticipant,
    admitAll,
    rejectParticipant,

    // Refresh
    refreshParticipants: fetchParticipants,
    refreshWaitingRoom: fetchWaitingRoom,
  }
}
