"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Search, MoreHorizontal, Shield, UserCog, Trash2 } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { User, OrganizationMember, Organization } from "@/types/database"

interface UserWithMemberships extends User {
  memberships: (OrganizationMember & { organization: Organization })[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithMemberships[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const fetchUsers = useCallback(async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      // Fetch memberships for each user
      const usersWithMemberships = await Promise.all(
        (usersData || []).map(async (user: User) => {
          const { data: memberships } = await supabase
            .from("organization_members")
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq("user_id", user.id)

          return {
            ...user,
            memberships: memberships || [],
          }
        })
      )

      setUsers(usersWithMemberships as UserWithMemberships[])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    )
  })

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage users across all organizations
        </p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.full_name || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.memberships.length === 0 ? (
                        <span className="text-muted-foreground">None</span>
                      ) : (
                        user.memberships.map((m) => (
                          <Badge
                            key={m.id}
                            variant={getRoleBadgeVariant(m.role)}
                            className="text-xs"
                          >
                            {m.organization?.name} ({m.role})
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {user.last_activity_at
                      ? format(new Date(user.last_activity_at), "MMM d, yyyy HH:mm")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
