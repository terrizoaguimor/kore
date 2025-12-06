"use client"

import { useState, useEffect, useCallback } from "react"
import { HardDrive, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { formatBytes } from "@/lib/utils"
import type { Organization } from "@/types/database"

interface OrganizationStorage extends Organization {
  percentage: number
}

export default function AdminStoragePage() {
  const [organizations, setOrganizations] = useState<OrganizationStorage[]>([])
  const [totalStats, setTotalStats] = useState({ used: 0, quota: 0, files: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const fetchStorageData = useCallback(async () => {
    try {
      const { data: orgsData, error } = await supabase
        .from("organizations")
        .select("*")
        .order("storage_used", { ascending: false })

      if (error) throw error

      const orgsWithPercentage = (orgsData || []).map((org: Organization) => ({
        ...org,
        percentage: org.storage_quota > 0
          ? (org.storage_used / org.storage_quota) * 100
          : 0,
      }))

      setOrganizations(orgsWithPercentage)

      // Calculate totals
      const totalUsed = orgsData?.reduce((acc: number, org: Organization) => acc + (org.storage_used || 0), 0) || 0
      const totalQuota = orgsData?.reduce((acc: number, org: Organization) => acc + (org.storage_quota || 0), 0) || 0

      const { count: filesCount } = await supabase
        .from("files")
        .select("*", { count: "exact", head: true })
        .eq("type", "file")

      setTotalStats({
        used: totalUsed,
        quota: totalQuota,
        files: filesCount || 0,
      })
    } catch (error) {
      console.error("Error fetching storage data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStorageData()
  }, [fetchStorageData])

  const getStorageStatus = (percentage: number) => {
    if (percentage >= 90) return { label: "Critical", variant: "destructive" as const }
    if (percentage >= 75) return { label: "Warning", variant: "default" as const }
    return { label: "Healthy", variant: "secondary" as const }
  }

  const overallPercentage = totalStats.quota > 0
    ? (totalStats.used / totalStats.quota) * 100
    : 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Storage</h1>
        <p className="text-muted-foreground">
          Monitor and manage storage across organizations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStats.used)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(totalStats.quota)} allocated
            </p>
            <Progress value={overallPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.files.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {organizations.length} organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations Near Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter((o) => o.percentage >= 75).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Using 75% or more of quota
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Storage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Storage by Organization</CardTitle>
          <CardDescription>
            Detailed storage usage for each organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading storage data...
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => {
                  const status = getStorageStatus(org.percentage)
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{formatBytes(org.storage_used)}</TableCell>
                      <TableCell>{formatBytes(org.storage_quota)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-32">
                          <Progress value={org.percentage} className="flex-1" />
                          <span className="text-sm text-muted-foreground w-12">
                            {org.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
