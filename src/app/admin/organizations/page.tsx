"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Search, MoreHorizontal, Users, HardDrive, Settings, Trash2, Plus } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { formatBytes } from "@/lib/utils"
import { toast } from "sonner"
import type { Organization } from "@/types/database"

interface OrganizationWithStats extends Organization {
  member_count: number
  file_count: number
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const fetchOrganizations = useCallback(async () => {
    try {
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })

      if (orgsError) throw orgsError

      // Fetch stats for each organization
      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (org: Organization) => {
          const [{ count: memberCount }, { count: fileCount }] = await Promise.all([
            supabase
              .from("organization_members")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id),
            supabase
              .from("files")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .eq("type", "file"),
          ])

          return {
            ...org,
            member_count: memberCount || 0,
            file_count: fileCount || 0,
          }
        })
      )

      setOrganizations(orgsWithStats)
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to load organizations")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    )
  })

  const getStoragePercentage = (used: number, quota: number) => {
    if (quota === 0) return 0
    return Math.min((used / quota) * 100, 100)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations and their settings
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
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
              <TableHead>Organization</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-lg font-semibold text-primary">
                          {org.name.substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {org.member_count}
                    </div>
                  </TableCell>
                  <TableCell>{org.file_count}</TableCell>
                  <TableCell>
                    <div className="w-32 space-y-1">
                      <Progress
                        value={getStoragePercentage(org.storage_used, org.storage_quota)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(org.storage_used)} / {formatBytes(org.storage_quota)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(org.created_at), "MMM d, yyyy")}
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
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <HardDrive className="mr-2 h-4 w-4" />
                          Manage Storage
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Organization
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
