"use client"

// ============================================
// KORE MEET - Dashboard Page
// Video Meetings Management
// ============================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRooms } from "@/hooks/use-meet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Video,
  Plus,
  Link2,
  Copy,
  MoreVertical,
  Trash2,
  Users,
  Clock,
  Calendar,
  Settings,
  ExternalLink,
} from "lucide-react"

export default function MeetPage() {
  const router = useRouter()
  const { rooms, loading, createRoom, deleteRoom, getToken } = useRooms()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [enableRecording, setEnableRecording] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(50)
  const [joinRoomId, setJoinRoomId] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreating(true)
    try {
      const room = await createRoom({
        unique_name: newRoomName || undefined,
        max_participants: maxParticipants,
        enable_recording: enableRecording,
      })

      setIsCreateOpen(false)
      setNewRoomName("")
      setEnableRecording(false)
      setMaxParticipants(50)

      // Navigate to the room
      router.push(`/meet/${room.id}`)
    } catch (error) {
      console.error("Failed to create room:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartInstantMeeting = async () => {
    setIsCreating(true)
    try {
      const room = await createRoom({
        max_participants: 50,
      })
      router.push(`/meet/${room.id}`)
    } catch (error) {
      console.error("Failed to start instant meeting:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      router.push(`/meet/${joinRoomId.trim()}`)
    }
  }

  const handleCopyLink = (roomId: string) => {
    const link = `${window.location.origin}/meet/${roomId}`
    navigator.clipboard.writeText(link)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      await deleteRoom(roomId)
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KORE Meet</h1>
          <p className="text-muted-foreground">Video meetings and collaboration</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link2 className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Meeting</DialogTitle>
                <DialogDescription>
                  Enter the meeting ID or link to join
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Meeting ID</Label>
                  <Input
                    id="roomId"
                    placeholder="Enter meeting ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsJoinOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleJoinRoom} disabled={!joinRoomId.trim()}>
                  Join
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleStartInstantMeeting} disabled={isCreating}>
            <Video className="mr-2 h-4 w-4" />
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={handleStartInstantMeeting}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-primary" />
              Instant Meeting
            </CardTitle>
            <CardDescription>Start a meeting right now</CardDescription>
          </CardHeader>
        </Card>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-primary" />
                  New Meeting
                </CardTitle>
                <CardDescription>Create a scheduled meeting</CardDescription>
              </CardHeader>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Meeting</DialogTitle>
              <DialogDescription>
                Set up a new video meeting room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Meeting Name (optional)</Label>
                <Input
                  id="roomName"
                  placeholder="Team Standup"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="recording">Enable Recording</Label>
                <Switch
                  id="recording"
                  checked={enableRecording}
                  onCheckedChange={setEnableRecording}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoom} disabled={isCreating}>
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setIsJoinOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Join Meeting
            </CardTitle>
            <CardDescription>Join with a meeting ID</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Rooms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meeting Rooms</h2>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No meeting rooms</h3>
            <p className="text-muted-foreground mt-2">
              Create a new meeting or start an instant meeting
            </p>
            <Button className="mt-4" onClick={handleStartInstantMeeting}>
              <Plus className="mr-2 h-4 w-4" />
              Create Meeting
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {room.unique_name || `Room ${room.id.slice(0, 8)}`}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Created {new Date(room.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(room.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/meet/${room.id}`)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Room
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Room
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{room.max_participants} max</span>
                    </div>
                    {room.enable_recording && (
                      <div className="flex items-center gap-1 text-red-500">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Recording
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => router.push(`/meet/${room.id}`)}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Join
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
