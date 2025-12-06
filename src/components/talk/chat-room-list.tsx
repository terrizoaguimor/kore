"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Hash, Users, User as UserIcon, MessageSquare, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { ChatRoom, User, ChatRoomParticipant } from "@/types/database"

interface ChatRoomWithDetails extends ChatRoom {
  participants?: (ChatRoomParticipant & { user: User })[]
  last_message?: {
    content: string
    created_at: string
    sender: User | null
  }
  unread_count?: number
}

interface ChatRoomListProps {
  rooms: ChatRoomWithDetails[]
  selectedRoomId?: string
  onSelectRoom: (roomId: string) => void
  currentUserId: string
}

export function ChatRoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  currentUserId
}: ChatRoomListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true
    const roomName = getRoomName(room, currentUserId)
    return roomName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isSelected={room.id === selectedRoomId}
                onClick={() => onSelectRoom(room.id)}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function ChatRoomItem({
  room,
  isSelected,
  onClick,
  currentUserId,
}: {
  room: ChatRoomWithDetails
  isSelected: boolean
  onClick: () => void
  currentUserId: string
}) {
  const roomName = getRoomName(room, currentUserId)
  const roomAvatar = getRoomAvatar(room, currentUserId)
  const RoomIcon = getRoomIcon(room.type)

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      )}
    >
      <div className="relative">
        {roomAvatar ? (
          <Avatar>
            <AvatarImage src={roomAvatar} alt={roomName} />
            <AvatarFallback>
              {roomName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isSelected ? "bg-primary-foreground/20" : "bg-muted"
          )}>
            <RoomIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{roomName}</span>
          {room.last_message && (
            <span className={cn(
              "text-xs",
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatDistanceToNow(new Date(room.last_message.created_at), {
                addSuffix: false,
                locale: es
              })}
            </span>
          )}
        </div>

        {room.last_message && (
          <p className={cn(
            "text-sm truncate",
            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {room.last_message.sender?.full_name && (
              <span className="font-medium">
                {room.last_message.sender.id === currentUserId
                  ? "You"
                  : room.last_message.sender.full_name.split(" ")[0]}
                : {" "}
              </span>
            )}
            {room.last_message.content}
          </p>
        )}
      </div>

      {(room.unread_count ?? 0) > 0 && (
        <Badge variant={isSelected ? "secondary" : "default"} className="ml-2">
          {room.unread_count}
        </Badge>
      )}
    </button>
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

function getRoomAvatar(room: ChatRoomWithDetails, currentUserId: string): string | null {
  if (room.avatar_url) return room.avatar_url

  if (room.type === "direct" && room.participants) {
    const otherParticipant = room.participants.find(p => p.user_id !== currentUserId)
    return otherParticipant?.user?.avatar_url || null
  }

  return null
}

function getRoomIcon(type: ChatRoom["type"]) {
  switch (type) {
    case "direct":
      return UserIcon
    case "group":
      return Users
    case "channel":
    case "public":
      return Hash
    default:
      return MessageSquare
  }
}
