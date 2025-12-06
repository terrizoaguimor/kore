"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Video, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChatRoomList } from "@/components/talk/chat-room-list"
import { ChatConversation } from "@/components/talk/chat-conversation"
import { NewChatDialog } from "@/components/talk/new-chat-dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"
import type { ChatRoom, ChatMessage, User, ChatRoomParticipant } from "@/types/database"

interface ChatRoomWithDetails extends ChatRoom {
  participants?: (ChatRoomParticipant & { user: User })[]
  last_message?: {
    content: string
    created_at: string
    sender: User | null
  }
  unread_count?: number
}

interface MessageWithSender extends ChatMessage {
  sender: User | null
}

export default function TalkPage() {
  const { user, organization } = useAuthStore()
  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [organizationMembers, setOrganizationMembers] = useState<User[]>([])
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    if (!organization || !user) return

    try {
      // First get rooms where user is a participant
      const { data: participantData } = await supabase
        .from("chat_room_participants")
        .select("room_id")
        .eq("user_id", user.id)

      const roomIds = participantData?.map((p: { room_id: string }) => p.room_id) || []

      if (roomIds.length === 0) {
        // Also get public channels in the org
        const { data: publicRooms } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("organization_id", organization.id)
          .eq("type", "public")

        setRooms(publicRooms || [])
        return
      }

      // Get rooms with participants
      const { data: roomsData, error } = await supabase
        .from("chat_rooms")
        .select(`
          *,
          participants:chat_room_participants(
            *,
            user:users(*)
          )
        `)
        .or(`id.in.(${roomIds.join(",")}),and(organization_id.eq.${organization.id},type.eq.public)`)
        .order("last_message_at", { ascending: false, nullsFirst: false })

      if (error) throw error

      // Get last message for each room
      const roomsWithLastMessage = await Promise.all(
        (roomsData || []).map(async (room: ChatRoom) => {
          const { data: lastMessageData } = await supabase
            .from("chat_messages")
            .select(`
              content,
              created_at,
              sender:users(*)
            `)
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          return {
            ...room,
            last_message: lastMessageData || undefined,
          }
        })
      )

      setRooms(roomsWithLastMessage as ChatRoomWithDetails[])
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }, [organization, user?.id, supabase])

  // Fetch messages for selected room
  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:users(*)
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages((data as MessageWithSender[]) || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }, [supabase])

  // Fetch organization members
  const fetchMembers = useCallback(async () => {
    if (!organization) return

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          user:users(*)
        `)
        .eq("organization_id", organization.id)

      if (error) throw error

      const members = data
        ?.map((m: { user: User | null }) => m.user)
        .filter((u: User | null): u is User => u !== null) || []

      setOrganizationMembers(members)
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }, [organization, supabase])

  // Initial data fetch
  useEffect(() => {
    fetchRooms()
    fetchMembers()
  }, [fetchRooms, fetchMembers])

  // Fetch messages when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId)
    } else {
      setMessages([])
    }
  }, [selectedRoomId, fetchMessages])

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedRoomId) return

    const channel = supabase
      .channel(`room:${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        async (payload: { new: ChatMessage }) => {
          // Fetch the sender info for the new message
          const { data: senderData } = await supabase
            .from("users")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single()

          const newMessage: MessageWithSender = {
            ...(payload.new as ChatMessage),
            sender: senderData,
          }

          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRoomId, supabase])

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!selectedRoomId || !user) return

    try {
      const { error } = await supabase.from("chat_messages").insert({
        room_id: selectedRoomId,
        sender_id: user.id,
        content,
        message_type: "text",
      })

      if (error) throw error

      // Update room's last_message_at
      await supabase
        .from("chat_rooms")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedRoomId)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  // Create direct chat
  const handleCreateDirectChat = async (userId: string) => {
    if (!organization || !user) return

    try {
      // Check if direct chat already exists
      const { data: existingParticipation } = await supabase
        .from("chat_room_participants")
        .select("room_id")
        .eq("user_id", user.id)

      if (existingParticipation && existingParticipation.length > 0) {
        const roomIds = existingParticipation.map((p: { room_id: string }) => p.room_id)

        const { data: existingRoom } = await supabase
          .from("chat_rooms")
          .select(`
            *,
            participants:chat_room_participants(user_id)
          `)
          .in("id", roomIds)
          .eq("type", "direct")

        const directRoom = existingRoom?.find((room: ChatRoom & { participants?: { user_id: string }[] }) => {
          const participantIds = room.participants?.map((p: { user_id: string }) => p.user_id) || []
          return participantIds.includes(userId) && participantIds.length === 2
        })

        if (directRoom) {
          setSelectedRoomId(directRoom.id)
          return
        }
      }

      // Create new direct chat room
      const { data: newRoom, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          organization_id: organization.id,
          type: "direct",
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add participants
      const { error: participantsError } = await supabase
        .from("chat_room_participants")
        .insert([
          { room_id: newRoom.id, user_id: user.id, role: "owner" },
          { room_id: newRoom.id, user_id: userId, role: "member" },
        ])

      if (participantsError) throw participantsError

      await fetchRooms()
      setSelectedRoomId(newRoom.id)
      toast.success("Chat created")
    } catch (error) {
      console.error("Error creating direct chat:", error)
      toast.error("Failed to create chat")
    }
  }

  // Create group chat
  const handleCreateGroupChat = async (name: string, userIds: string[]) => {
    if (!organization || !user) return

    try {
      const { data: newRoom, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          organization_id: organization.id,
          name,
          type: "group",
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add all participants including creator
      const participants = [
        { room_id: newRoom.id, user_id: user.id, role: "owner" as const },
        ...userIds.map((id) => ({
          room_id: newRoom.id,
          user_id: id,
          role: "member" as const,
        })),
      ]

      const { error: participantsError } = await supabase
        .from("chat_room_participants")
        .insert(participants)

      if (participantsError) throw participantsError

      await fetchRooms()
      setSelectedRoomId(newRoom.id)
      toast.success("Group created")
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group")
    }
  }

  // Create channel
  const handleCreateChannel = async (name: string, description?: string) => {
    if (!organization || !user) return

    try {
      const { data: newRoom, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          organization_id: organization.id,
          name,
          description,
          type: "channel",
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add creator as owner
      const { error: participantError } = await supabase
        .from("chat_room_participants")
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: "owner",
        })

      if (participantError) throw participantError

      await fetchRooms()
      setSelectedRoomId(newRoom.id)
      toast.success("Channel created")
    } catch (error) {
      console.error("Error creating channel:", error)
      toast.error("Failed to create channel")
    }
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please log in to access Talk</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Talk</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Video className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
          <Button onClick={() => setIsNewChatOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Room List */}
        <div className="w-80 border-r bg-background">
          <ChatRoomList
            rooms={rooms}
            selectedRoomId={selectedRoomId ?? undefined}
            onSelectRoom={setSelectedRoomId}
            currentUserId={user.id}
          />
        </div>

        {/* Main content - Conversation */}
        <div className="flex-1">
          {selectedRoom ? (
            <ChatConversation
              room={selectedRoom}
              messages={messages}
              currentUserId={user.id}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Select a conversation</h3>
                <p className="mt-2 text-muted-foreground">
                  Choose a chat from the list or start a new one
                </p>
                <Button onClick={() => setIsNewChatOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        organizationMembers={organizationMembers}
        onCreateDirectChat={handleCreateDirectChat}
        onCreateGroupChat={handleCreateGroupChat}
        onCreateChannel={handleCreateChannel}
        currentUserId={user.id}
      />
    </div>
  )
}
