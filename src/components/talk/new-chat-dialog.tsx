"use client"

import { useState, useEffect } from "react"
import { Hash, Users, UserIcon, Loader2, Search, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { User } from "@/types/database"

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationMembers: User[]
  onCreateDirectChat: (userId: string) => Promise<void>
  onCreateGroupChat: (name: string, userIds: string[]) => Promise<void>
  onCreateChannel: (name: string, description?: string) => Promise<void>
  currentUserId: string
}

export function NewChatDialog({
  open,
  onOpenChange,
  organizationMembers,
  onCreateDirectChat,
  onCreateGroupChat,
  onCreateChannel,
  currentUserId,
}: NewChatDialogProps) {
  const [activeTab, setActiveTab] = useState<"direct" | "group" | "channel">("direct")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupName, setGroupName] = useState("")
  const [channelName, setChannelName] = useState("")
  const [channelDescription, setChannelDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSelectedUsers([])
      setGroupName("")
      setChannelName("")
      setChannelDescription("")
      setActiveTab("direct")
    }
  }, [open])

  // Filter out current user from the list
  const availableMembers = organizationMembers.filter(
    (member) => member.id !== currentUserId
  )

  const filteredMembers = availableMembers.filter((member) => {
    if (!searchQuery) return true
    const name = member.full_name?.toLowerCase() || ""
    const email = member.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const handleUserClick = async (userId: string) => {
    if (activeTab === "direct") {
      setIsLoading(true)
      try {
        await onCreateDirectChat(userId)
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      )
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) return

    setIsLoading(true)
    try {
      await onCreateGroupChat(groupName.trim(), selectedUsers)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!channelName.trim()) return

    setIsLoading(true)
    try {
      await onCreateChannel(channelName.trim(), channelDescription.trim() || undefined)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message, create a group, or open a channel.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" />
              Group
            </TabsTrigger>
            <TabsTrigger value="channel" className="gap-2">
              <Hash className="h-4 w-4" />
              Channel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members found
                  </p>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleUserClick(member.id)}
                      disabled={isLoading}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 transition-colors",
                        "hover:bg-muted"
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.full_name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">
                          {member.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="group" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Select members ({selectedUsers.length} selected)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredMembers.map((member) => {
                  const isSelected = selectedUsers.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleUserClick(member.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.full_name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">
                          {member.full_name || "Unknown"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length < 1 || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="channel" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel name</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="channelName"
                  placeholder="general"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelDescription">Description (optional)</Label>
              <Input
                id="channelDescription"
                placeholder="What is this channel about?"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Channels are open to all organization members.
            </p>

            <DialogFooter>
              <Button
                onClick={handleCreateChannel}
                disabled={!channelName.trim() || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Channel
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
