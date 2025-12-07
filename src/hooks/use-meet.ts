"use client"

// ============================================
// KORE MEET HOOKS
// Video Room Client Integration
// ============================================

import { useState, useEffect, useCallback, useRef } from "react"
import { initialize, type Room } from "@telnyx/video"
import type {
  VideoRoom,
  ClientToken,
  RoomConnectionState,
  Stream as MeetStream,
  RemoteParticipant,
} from "@/types/meet"

// ============================================
// ROOM HOOK
// For connecting to and managing a video room
// ============================================

export interface UseRoomOptions {
  roomId: string
  token: string
  context?: Record<string, any>
  autoConnect?: boolean
}

export interface UseRoomReturn {
  room: Room | null
  connectionState: RoomConnectionState
  localParticipant: { id: string } | null
  remoteParticipants: Map<string, RemoteParticipant>
  streams: Map<string, MeetStream>
  connect: () => Promise<void>
  disconnect: () => void
  publishStream: (key: string, options: { audio?: MediaStreamTrack; video?: MediaStreamTrack }) => Promise<void>
  unpublishStream: (key: string) => Promise<void>
  subscribeToStream: (participantId: string, streamKey: string, options?: { audio?: boolean; video?: boolean }) => Promise<void>
  unsubscribeFromStream: (participantId: string, streamKey: string) => Promise<void>
  sendMessage: (payload: string, recipients?: string[], meta?: string) => void
  error: string | null
}

export function useRoom(options: UseRoomOptions): UseRoomReturn {
  const { roomId, token, context, autoConnect = false } = options

  const roomRef = useRef<Room | null>(null)
  const [connectionState, setConnectionState] = useState<RoomConnectionState>("new")
  const [localParticipant, setLocalParticipant] = useState<{ id: string } | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map())
  const [streams, setStreams] = useState<Map<string, MeetStream>>(new Map())
  const [error, setError] = useState<string | null>(null)

  // Setup room event listeners
  const setupRoomListeners = useCallback((room: Room) => {
    room.on("state_changed", (state: any) => {
      console.log("[Meet] State changed:", state)
    })

    room.on("connected", (state: any) => {
      console.log("[Meet] Connected to room")
      setConnectionState("connected")
      const localP = room.getLocalParticipant()
      setLocalParticipant({ id: localP?.id || "" })
    })

    room.on("disconnected", () => {
      console.log("[Meet] Disconnected from room")
      setConnectionState("disconnected")
      setLocalParticipant(null)
      setRemoteParticipants(new Map())
      setStreams(new Map())
    })

    room.on("participant_joined", (participantId: string) => {
      console.log("[Meet] Participant joined:", participantId)
      setRemoteParticipants((prev) => {
        const updated = new Map(prev)
        updated.set(participantId, {
          id: participantId,
          streams: new Map(),
        })
        return updated
      })
    })

    room.on("participant_left", (participantId: string) => {
      console.log("[Meet] Participant left:", participantId)
      setRemoteParticipants((prev) => {
        const updated = new Map(prev)
        updated.delete(participantId)
        return updated
      })
    })

    room.on("stream_published", (participantId: string, streamKey: string) => {
      console.log("[Meet] Stream published:", participantId, streamKey)
      setStreams((prev) => {
        const updated = new Map(prev)
        const key = `${participantId}:${streamKey}`
        updated.set(key, {
          key: streamKey,
          participantId,
          audioEnabled: true,
          videoEnabled: true,
        })
        return updated
      })
    })

    room.on("stream_unpublished", (participantId: string, streamKey: string) => {
      console.log("[Meet] Stream unpublished:", participantId, streamKey)
      setStreams((prev) => {
        const updated = new Map(prev)
        updated.delete(`${participantId}:${streamKey}`)
        return updated
      })
    })

    room.on("subscription_started", (participantId: string, streamKey: string) => {
      console.log("[Meet] Subscription started:", participantId, streamKey)
      const streamData = room.getParticipantStream(participantId, streamKey)
      if (streamData) {
        setStreams((prev) => {
          const updated = new Map(prev)
          const key = `${participantId}:${streamKey}`
          updated.set(key, {
            key: streamKey,
            participantId,
            audioTrack: streamData.audioTrack,
            videoTrack: streamData.videoTrack,
            audioEnabled: true,
            videoEnabled: true,
          })
          return updated
        })
      }
    })

    room.on("track_enabled", (participantId: string, streamKey: string, kind: "audio" | "video") => {
      console.log("[Meet] Track enabled:", participantId, streamKey, kind)
      setStreams((prev) => {
        const updated = new Map(prev)
        const key = `${participantId}:${streamKey}`
        const stream = updated.get(key)
        if (stream) {
          updated.set(key, {
            ...stream,
            [`${kind}Enabled`]: true,
          })
        }
        return updated
      })
    })

    room.on("track_disabled", (participantId: string, streamKey: string, kind: "audio" | "video") => {
      console.log("[Meet] Track disabled:", participantId, streamKey, kind)
      setStreams((prev) => {
        const updated = new Map(prev)
        const key = `${participantId}:${streamKey}`
        const stream = updated.get(key)
        if (stream) {
          updated.set(key, {
            ...stream,
            [`${kind}Enabled`]: false,
          })
        }
        return updated
      })
    })

    room.on("message_received", (participantId: string, message: any) => {
      console.log("[Meet] Message received:", participantId, message)
    })
  }, [])

  const connect = useCallback(async () => {
    if (!roomId || !token) {
      throw new Error("Room ID and token are required")
    }

    setConnectionState("connecting")
    setError(null)

    try {
      // Initialize the room using the SDK's initialize function
      const room = await initialize({
        roomId,
        clientToken: token,
        context: context ? JSON.stringify(context) : undefined,
      })

      roomRef.current = room
      setupRoomListeners(room)

      // Connect to the room
      await room.connect()
      setConnectionState("connected")

      const localP = room.getLocalParticipant()
      setLocalParticipant({ id: localP?.id || "" })
    } catch (err: any) {
      console.error("[Meet] Failed to connect:", err)
      setError(err.message)
      setConnectionState("disconnected")
      throw err
    }
  }, [])

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect()
    }
  }, [])

  const publishStream = useCallback(
    async (key: string, options: { audio?: MediaStreamTrack; video?: MediaStreamTrack }) => {
      if (!roomRef.current) {
        throw new Error("Room not connected")
      }

      await roomRef.current.addStream(key, options)
    },
    []
  )

  const unpublishStream = useCallback(async (key: string) => {
    if (!roomRef.current) {
      throw new Error("Room not connected")
    }

    await roomRef.current.removeStream(key)
  }, [])

  const subscribeToStream = useCallback(
    async (participantId: string, streamKey: string, options?: { audio?: boolean; video?: boolean }) => {
      if (!roomRef.current) {
        throw new Error("Room not connected")
      }

      await roomRef.current.addSubscription(participantId, streamKey, {
        audio: options?.audio ?? true,
        video: options?.video ?? true,
      })
    },
    []
  )

  const unsubscribeFromStream = useCallback(async (participantId: string, streamKey: string) => {
    if (!roomRef.current) {
      throw new Error("Room not connected")
    }

    await roomRef.current.removeSubscription(participantId, streamKey)
  }, [])

  const sendMessage = useCallback((payload: string, recipients?: string[], meta?: string) => {
    if (!roomRef.current) {
      throw new Error("Room not connected")
    }

    roomRef.current.sendMessage({ type: "text", payload, meta }, recipients)
  }, [])

  return {
    room: roomRef.current,
    connectionState,
    localParticipant,
    remoteParticipants,
    streams,
    connect,
    disconnect,
    publishStream,
    unpublishStream,
    subscribeToStream,
    unsubscribeFromStream,
    sendMessage,
    error,
  }
}

// ============================================
// LOCAL MEDIA HOOK
// For managing local audio/video streams
// ============================================

export interface UseLocalMediaOptions {
  audio?: boolean | MediaTrackConstraints
  video?: boolean | MediaTrackConstraints
}

export interface UseLocalMediaReturn {
  stream: MediaStream | null
  audioTrack: MediaStreamTrack | null
  videoTrack: MediaStreamTrack | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  toggleAudio: () => void
  toggleVideo: () => void
  stopMedia: () => void
  startMedia: () => Promise<void>
  switchCamera: () => Promise<void>
  error: string | null
}

export function useLocalMedia(options: UseLocalMediaOptions = {}): UseLocalMediaReturn {
  const { audio = true, video = true } = options

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null)
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [error, setError] = useState<string | null>(null)

  const startMedia = useCallback(async () => {
    setError(null)

    try {
      const constraints: MediaStreamConstraints = {
        audio: audio ? (typeof audio === "boolean" ? true : audio) : false,
        video: video
          ? typeof video === "boolean"
            ? { facingMode }
            : { ...video, facingMode }
          : false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      const newAudioTrack = mediaStream.getAudioTracks()[0] || null
      const newVideoTrack = mediaStream.getVideoTracks()[0] || null

      setAudioTrack(newAudioTrack)
      setVideoTrack(newVideoTrack)
      setIsAudioEnabled(newAudioTrack?.enabled ?? false)
      setIsVideoEnabled(newVideoTrack?.enabled ?? false)
    } catch (err: any) {
      console.error("[Meet] Failed to get media:", err)
      setError(err.message || "Failed to access camera/microphone")
    }
  }, [audio, video, facingMode])

  const stopMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setAudioTrack(null)
      setVideoTrack(null)
    }
  }, [stream])

  const toggleAudio = useCallback(() => {
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsAudioEnabled(audioTrack.enabled)
    }
  }, [audioTrack])

  const toggleVideo = useCallback(() => {
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoEnabled(videoTrack.enabled)
    }
  }, [videoTrack])

  const switchCamera = useCallback(async () => {
    if (!video) return

    const newFacingMode = facingMode === "user" ? "environment" : "user"
    setFacingMode(newFacingMode)

    // Stop current video track
    if (videoTrack) {
      videoTrack.stop()
    }

    // Get new video track
    try {
      const constraints: MediaStreamConstraints = {
        video: typeof video === "boolean" ? { facingMode: newFacingMode } : { ...video, facingMode: newFacingMode },
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      const newVideoTrack = newStream.getVideoTracks()[0]

      if (stream && newVideoTrack) {
        // Replace track in existing stream
        const oldTrack = stream.getVideoTracks()[0]
        if (oldTrack) {
          stream.removeTrack(oldTrack)
        }
        stream.addTrack(newVideoTrack)
      }

      setVideoTrack(newVideoTrack)
      setIsVideoEnabled(true)
    } catch (err: any) {
      console.error("[Meet] Failed to switch camera:", err)
      setError(err.message)
    }
  }, [video, videoTrack, stream, facingMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  return {
    stream,
    audioTrack,
    videoTrack,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    stopMedia,
    startMedia,
    switchCamera,
    error,
  }
}

// ============================================
// ROOMS MANAGEMENT HOOK
// For listing and managing rooms
// ============================================

export function useRooms() {
  const [rooms, setRooms] = useState<VideoRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = useCallback(async (page?: number, pageSize?: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (page) params.set("page", String(page))
      if (pageSize) params.set("pageSize", String(pageSize))

      const response = await fetch(`/api/meet/rooms?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setRooms(data.data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createRoom = useCallback(async (options: {
    unique_name?: string
    max_participants?: number
    enable_recording?: boolean
  }) => {
    try {
      const response = await fetch("/api/meet/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      if (data.success) {
        await fetchRooms()
        return data.data as VideoRoom
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchRooms])

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/meet/rooms/${roomId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await fetchRooms()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchRooms])

  const getToken = useCallback(async (roomId: string): Promise<ClientToken> => {
    const response = await fetch(`/api/meet/rooms/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generateToken" }),
    })

    const data = await response.json()

    if (data.success) {
      return data.data as ClientToken
    } else {
      throw new Error(data.error)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    deleteRoom,
    getToken,
  }
}

// ============================================
// SCREEN SHARE HOOK
// For screen sharing functionality
// ============================================

export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startSharing = useCallback(async () => {
    setError(null)

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      setStream(displayStream)
      setIsSharing(true)

      // Handle when user stops sharing via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        setStream(null)
        setIsSharing(false)
      }

      return displayStream
    } catch (err: any) {
      console.error("[Meet] Failed to share screen:", err)
      setError(err.message || "Failed to share screen")
      throw err
    }
  }, [])

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsSharing(false)
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  return {
    stream,
    isSharing,
    startSharing,
    stopSharing,
    error,
  }
}
