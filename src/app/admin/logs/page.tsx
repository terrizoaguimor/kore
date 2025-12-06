"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Search, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { ActivityLog, User, Organization } from "@/types/database"

interface ActivityLogWithDetails extends ActivityLog {
  user: User | null
  organization: Organization | null
}

const actionColors: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  login: "bg-purple-500",
  logout: "bg-gray-500",
  upload: "bg-cyan-500",
  download: "bg-amber-500",
  share: "bg-pink-500",
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("activity_logs")
        .select(`
          *,
          user:users(*),
          organization:organizations(*)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter)
      }

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs((data as ActivityLogWithDetails[]) || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("Failed to load activity logs")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, actionFilter, entityFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.user?.email.toLowerCase().includes(query) ||
      log.user?.full_name?.toLowerCase().includes(query)
    )
  })

  const getActionColor = (action: string) => {
    return actionColors[action.toLowerCase()] || "bg-gray-500"
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor all activity across the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="download">Download</SelectItem>
            <SelectItem value="share">Share</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="folder">Folders</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="organization">Organizations</SelectItem>
            <SelectItem value="calendar">Calendar</SelectItem>
            <SelectItem value="contact">Contacts</SelectItem>
            <SelectItem value="message">Messages</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={log.user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {log.user.full_name?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getActionColor(log.action)} text-white`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.entity_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.organization?.name || "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {log.details && typeof log.details === "object"
                      ? JSON.stringify(log.details).substring(0, 50)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {logs.length} logs (max 100)
      </div>
    </div>
  )
}
