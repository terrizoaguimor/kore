"use client"

// ============================================
// KORE MEET - Video Room Page
// Real-time video meeting interface
// ============================================

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useRoom, useLocalMedia, useScreenShare } from "@/hooks/use-meet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Copy,
  Send,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid,
  Hand,
  Circle,
  StopCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

export default function MeetingRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = use(params)
  const router = useRouter()

  // State
  const [token, setToken] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [layout, setLayout] = useState<"grid" | "speaker">("grid")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [userName, setUserName] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Hooks
  const localMedia = useLocalMedia({ audio: true, video: true })
  const screenShare = useScreenShare()

  const room = useRoom({
    roomId,
    token: token || "",
    autoConnect: false,
  })

  // Fetch token when component mounts
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(`/api/meet/rooms/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generateToken" }),
        })

        const data = await response.json()

        if (data.success) {
          setToken(data.data.token)
        } else {
          setError(data.error || "Failed to get access token")
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to meeting")
      }
    }

    fetchToken()
  }, [roomId])

  // Update local video preview
  useEffect(() => {
    if (localVideoRef.current && localMedia.stream) {
      localVideoRef.current.srcObject = localMedia.stream
    }
  }, [localMedia.stream])

  // Handle join meeting
  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)

    try {
      // Start local media
      await localMedia.startMedia()

      // Connect to room
      await room.connect()

      // Publish local stream
      if (localMedia.audioTrack || localMedia.videoTrack) {
        await room.publishStream("main", {
          audio: localMedia.audioTrack || undefined,
          video: localMedia.videoTrack || undefined,
        })
      }

      setHasJoined(true)
    } catch (err: any) {
      console.error("Failed to join:", err)
      setError(err.message || "Failed to join meeting")
    } finally {
      setIsJoining(false)
    }
  }

  // Handle leave meeting
  const handleLeave = () => {
    room.disconnect()
    localMedia.stopMedia()
    screenShare.stopSharing()
    router.push("/meet")
  }

  // Handle screen share
  const handleScreenShare = async () => {
    if (screenShare.isSharing) {
      await room.unpublishStream("screen")
      screenShare.stopSharing()
    } else {
      const stream = await screenShare.startSharing()
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0]
        await room.publishStream("screen", { video: videoTrack })
      }
    }
  }

  // Handle send message
  const handleSendMessage = () => {
    if (newMessage.trim() && room.room) {
      // Send message using SDK (payload=content, meta=JSON with sender info)
      room.sendMessage(
        newMessage.trim(),
        undefined,
        JSON.stringify({ senderName: userName || "You" })
      )
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: room.localParticipant?.id || "local",
          senderName: userName || "You",
          content: newMessage.trim(),
          timestamp: new Date(),
        },
      ])
      setNewMessage("")
    }
  }

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Pre-join screen
  if (!hasJoined) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-2xl p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Video Preview */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Video Preview</h2>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {localMedia.stream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-3xl">
                        {userName ? userName[0].toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Media Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={localMedia.isAudioEnabled ? "secondary" : "destructive"}
                          size="icon"
                          onClick={localMedia.toggleAudio}
                        >
                          {localMedia.isAudioEnabled ? (
                            <Mic className="h-4 w-4" />
                          ) : (
                            <MicOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {localMedia.isAudioEnabled ? "Mute" : "Unmute"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={localMedia.isVideoEnabled ? "secondary" : "destructive"}
                          size="icon"
                          onClick={localMedia.toggleVideo}
                        >
                          {localMedia.isVideoEnabled ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <VideoOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {localMedia.isVideoEnabled ? "Turn off video" : "Turn on video"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {!localMedia.stream && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={localMedia.startMedia}
                >
                  Enable Camera & Microphone
                </Button>
              )}
            </div>

            {/* Join Form */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Join Meeting</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Meeting ID: {roomId}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleJoin}
                  disabled={isJoining || !token}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Join Meeting
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/meet")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Main meeting UI
  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#202124] text-white"
    >
      {/* Video Grid */}
      <div className="flex-1 relative p-4">
        <div
          className={`h-full grid gap-2 ${
            layout === "grid"
              ? room.remoteParticipants.size > 1
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
              : "grid-cols-1"
          }`}
        >
          {/* Local Video */}
          <div className="relative bg-[#3c4043] rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm">
              You {!localMedia.isAudioEnabled && <MicOff className="inline h-3 w-3 ml-1" />}
            </div>
          </div>

          {/* Remote Participants */}
          {Array.from(room.remoteParticipants).map(([participantId, participant]) => (
            <div
              key={participantId}
              className="relative bg-[#3c4043] rounded-lg overflow-hidden aspect-video"
            >
              <RemoteVideo
                participantId={participantId}
                streams={room.streams}
                room={room}
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm">
                Participant {participantId.slice(0, 8)}
              </div>
            </div>
          ))}

          {/* Screen Share */}
          {screenShare.isSharing && (
            <div className="relative bg-[#3c4043] rounded-lg overflow-hidden aspect-video col-span-full">
              <ScreenShareVideo stream={screenShare.stream} />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm flex items-center gap-2">
                <Monitor className="h-3 w-3" />
                You are sharing your screen
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202124] border-t border-[#3c4043]">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Meeting ID: </span>
            <span>{roomId.slice(0, 8)}...</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={localMedia.isAudioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={localMedia.toggleAudio}
                >
                  {localMedia.isAudioEnabled ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {localMedia.isAudioEnabled ? "Mute" : "Unmute"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={localMedia.isVideoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={localMedia.toggleVideo}
                >
                  {localMedia.isVideoEnabled ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {localMedia.isVideoEnabled ? "Turn off video" : "Turn on video"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={screenShare.isSharing ? "destructive" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleScreenShare}
                >
                  {screenShare.isSharing ? (
                    <MonitorOff className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {screenShare.isSharing ? "Stop sharing" : "Share screen"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleLeave}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leave meeting</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right: Side Panel Controls */}
        <div className="flex items-center gap-2">
          <Sheet open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Participants ({room.remoteParticipants.size + 1})</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                    <Avatar>
                      <AvatarFallback>{userName?.[0] || "Y"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{userName || "You"} (Host)</p>
                    </div>
                    {!localMedia.isAudioEnabled && <MicOff className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {Array.from(room.remoteParticipants).map(([id]) => (
                    <div key={id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                      <Avatar>
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">Participant {id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chat</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100vh-100px)]">
                <ScrollArea className="flex-1 mt-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLayout(layout === "grid" ? "speaker" : "grid")}>
                {layout === "grid" ? (
                  <>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Speaker View
                  </>
                ) : (
                  <>
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    Grid View
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// Remote video component
function RemoteVideo({
  participantId,
  streams,
  room,
}: {
  participantId: string
  streams: Map<string, any>
  room: any
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Find stream for this participant
    const streamKey = `${participantId}:main`
    const stream = streams.get(streamKey)

    if (stream && videoRef.current) {
      const mediaStream = new MediaStream()
      if (stream.audioTrack) mediaStream.addTrack(stream.audioTrack)
      if (stream.videoTrack) mediaStream.addTrack(stream.videoTrack)
      videoRef.current.srcObject = mediaStream
    }
  }, [participantId, streams])

  // Subscribe to participant's stream
  useEffect(() => {
    const subscribe = async () => {
      try {
        await room.subscribeToStream(participantId, "main")
      } catch (err) {
        console.error("Failed to subscribe:", err)
      }
    }
    subscribe()
  }, [participantId, room])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

// Screen share video component
function ScreenShareVideo({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-contain"
    />
  )
}
