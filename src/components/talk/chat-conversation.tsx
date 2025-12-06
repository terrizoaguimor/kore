"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Image as ImageIcon,
  File as FileIcon,
  Check,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, ChatRoom, User, ChatRoomParticipant } from "@/types/database"

interface MessageWithSender extends ChatMessage {
  sender: User | null
}

interface ChatRoomWithDetails extends ChatRoom {
  participants?: (ChatRoomParticipant & { user: User })[]
}

interface ChatConversationProps {
  room: ChatRoomWithDetails
  messages: MessageWithSender[]
  currentUserId: string
  onSendMessage: (content: string) => Promise<void>
  onLoadMore?: () => void
  isLoading?: boolean
}

export function ChatConversation({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMore,
  isLoading = false,
}: ChatConversationProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(newMessage.trim())
      setNewMessage("")
      inputRef.current?.focus()
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const roomName = getRoomName(room, currentUserId)

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={room.avatar_url || undefined} />
            <AvatarFallback>
              {roomName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{roomName}</h2>
            {room.participants && (
              <p className="text-sm text-muted-foreground">
                {room.participants.length} participant{room.participants.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Audio call</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video call</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {formatDateHeader(date)}
                </div>
              </div>
              {dateMessages.map((message, index) => {
                const isOwn = message.sender_id === currentUserId
                const showAvatar = !isOwn && (
                  index === 0 ||
                  dateMessages[index - 1]?.sender_id !== message.sender_id
                )

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    roomType={room.type}
                  />
                )
              })}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">No messages yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start the conversation!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />

          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  roomType,
}: {
  message: MessageWithSender
  isOwn: boolean
  showAvatar: boolean
  roomType: ChatRoom["type"]
}) {
  const showSenderName = !isOwn && roomType !== "direct"

  return (
    <div
      className={cn(
        "flex gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar && message.sender && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {message.sender.full_name?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {showSenderName && showAvatar && message.sender && (
          <span className="text-xs text-muted-foreground ml-1 mb-1 block">
            {message.sender.full_name}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          )}
        >
          {message.message_type === "text" ? (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : message.message_type === "image" ? (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm">Image</span>
            </div>
          ) : message.message_type === "file" ? (
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              <span className="text-sm">File</span>
            </div>
          ) : (
            <p className="text-sm italic">{message.content || "Message"}</p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isOwn && (
            <CheckCheck className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}

function getRoomName(room: ChatRoomWithDetails, currentUserId: string): string {
  if (room.name) return room.name

  if (room.type === "direct" && room.participants) {
    const otherParticipant = room.participants.find(p => p.user_id !== currentUserId)
    return otherParticipant?.user?.full_name || "Unknown User"
  }

  return room.type === "channel" ? "Channel" : "Group Chat"
}

function groupMessagesByDate(messages: MessageWithSender[]): Record<string, MessageWithSender[]> {
  return messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), "yyyy-MM-dd")
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, MessageWithSender[]>)
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMMM d, yyyy", { locale: es })
}
