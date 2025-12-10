"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Send,
  Paperclip,
  Smile,
  Image,
  Users,
  Settings,
  Trash2,
  LogOut,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import type { ChatMessage, User, ChatRoom, ChatRoomParticipant } from "@/types/database"

interface RoomWithParticipants extends ChatRoom {
  participants: (ChatRoomParticipant & { user: User })[]
}

interface MessageWithSender extends ChatMessage {
  sender: User | null
}

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [room, setRoom] = useState<RoomWithParticipants | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // Fetch room details
  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/talk/rooms/${resolvedParams.roomId}`)
      if (!response.ok) {
        toast.error("Room not found")
        router.push("/talk")
        return
      }
      const data = await response.json()
      setRoom(data.room)
    } catch (error) {
      console.error("Error fetching room:", error)
      toast.error("Failed to load room")
    }
  }, [resolvedParams.roomId, router])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/talk/rooms/${resolvedParams.roomId}/messages`)
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.roomId])

  useEffect(() => {
    fetchRoom()
    fetchMessages()
  }, [fetchRoom, fetchMessages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room:${resolvedParams.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${resolvedParams.roomId}`,
        },
        async (payload: { new: ChatMessage }) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single()

          const newMsg: MessageWithSender = {
            ...payload.new,
            sender,
          }

          setMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [resolvedParams.roomId, supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      const response = await fetch(`/api/talk/rooms/${resolvedParams.roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (!response.ok) throw new Error("Failed to send message")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const leaveRoom = async () => {
    try {
      const response = await fetch(`/api/talk/rooms/${resolvedParams.roomId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to leave room")

      toast.success("Left the conversation")
      router.push("/talk")
    } catch (error) {
      console.error("Error leaving room:", error)
      toast.error("Failed to leave room")
    }
  }

  // Get room display name
  const getRoomName = () => {
    if (!room) return ""
    if (room.name) return room.name

    if (room.type === "direct") {
      const otherParticipant = room.participants?.find(
        (p) => p.user_id !== user?.id
      )
      return otherParticipant?.user?.full_name || otherParticipant?.user?.email || "Direct Message"
    }

    return "Group Chat"
  }

  // Get room avatar
  const getRoomAvatar = () => {
    if (!room) return null

    if (room.type === "direct") {
      const otherParticipant = room.participants?.find(
        (p) => p.user_id !== user?.id
      )
      return otherParticipant?.user?.avatar_url
    }

    return room.avatar_url
  }

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageWithSender[] }[] = []
  let currentDate = ""
  messages.forEach((msg) => {
    const msgDate = formatMessageDate(new Date(msg.created_at))
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msgDate, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0B0B0B]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0B0B0B]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/talk")}
            className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={getRoomAvatar() || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-semibold">
              {getRoomName().substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="font-semibold text-white">{getRoomName()}</h1>
            <p className="text-xs text-[#A1A1AA]">
              {room?.participants?.length || 0} participant{room?.participants?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
          >
            <Video className="h-5 w-5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
              >
                <Users className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#1A1A1A] border-white/10 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Participants</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {room?.participants?.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#00E5FF]/20 text-[#00E5FF]">
                        {p.user?.full_name?.substring(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{p.user?.full_name || p.user?.email}</p>
                      <p className="text-xs text-[#A1A1AA] capitalize">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#A1A1AA] hover:text-white hover:bg-white/10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10">
              <DropdownMenuItem className="text-[#A1A1AA] hover:text-white hover:bg-white/5">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={leaveRoom}
                className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center justify-center mb-4">
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-[#A1A1AA]">
                {group.date}
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {group.messages.map((msg, idx) => {
                const isOwn = msg.sender_id === user?.id
                const showAvatar = !isOwn && (idx === 0 || group.messages[idx - 1]?.sender_id !== msg.sender_id)

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <div className="w-8">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender?.avatar_url || undefined} />
                            <AvatarFallback className="bg-[#00E5FF]/20 text-[#00E5FF] text-xs">
                              {msg.sender?.full_name?.substring(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && !isOwn && (
                        <span className="text-xs text-[#A1A1AA] mb-1 ml-1">
                          {msg.sender?.full_name || msg.sender?.email}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B]"
                            : "bg-[#1F1F1F] text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-xs text-[#A1A1AA]">
                          {format(new Date(msg.created_at), "HH:mm")}
                        </span>
                        {isOwn && (
                          <CheckCheck className="h-3 w-3 text-[#00E5FF]" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1F1F1F] p-4">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#A1A1AA] hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl bg-[#1F1F1F] border border-white/10 px-4 py-3 pr-12 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
              style={{ minHeight: "48px", maxHeight: "200px" }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 text-[#A1A1AA] hover:text-white hover:bg-transparent"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>

          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] hover:opacity-90 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
