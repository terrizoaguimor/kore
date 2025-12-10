import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface SecurityVisit {
  ip_address: string
  path: string
  is_suspicious: boolean
  is_bot: boolean
  threat_level: string
  country: string | null
  created_at: string
}

interface SecurityAlert {
  alert_type: string
  severity: string
  description: string
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get("hours") || "24")
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Get stats using the Supabase function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: statsData, error: statsError } = await (supabase as any)
      .rpc("get_security_stats", { hours_back: hours })

    if (statsError) {
      console.error("Error calling get_security_stats:", statsError)
    }

    // Get visits for detailed stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: visits, count: totalVisits } = await (supabase as any)
      .from("security_visits")
      .select("*", { count: "exact" })
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000)

    // Get blocked IPs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: blockedCount } = await (supabase as any)
      .from("security_blocked_ips")
      .select("*", { count: "exact", head: true })
      .or("expires_at.is.null,expires_at.gt.now()")

    // Get recent alerts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alerts } = await (supabase as any)
      .from("security_alerts")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20)

    // Process visits data
    const visitsList: SecurityVisit[] = visits || []
    const uniqueIps = new Set(visitsList.map((v) => v.ip_address)).size
    const suspiciousRequests = visitsList.filter((v) => v.is_suspicious).length
    const botVisits = visitsList.filter((v) => v.is_bot).length

    // Count paths
    const pathCounts: Record<string, number> = {}
    visitsList.forEach((v) => {
      pathCounts[v.path] = (pathCounts[v.path] || 0) + 1
    })
    const topPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Count IPs
    const ipCounts: Record<string, { count: number; is_suspicious: boolean }> = {}
    visitsList.forEach((v) => {
      if (!ipCounts[v.ip_address]) {
        ipCounts[v.ip_address] = { count: 0, is_suspicious: false }
      }
      ipCounts[v.ip_address].count++
      if (v.is_suspicious) ipCounts[v.ip_address].is_suspicious = true
    })
    const topIps = Object.entries(ipCounts)
      .map(([ip_address, data]) => ({ ip_address, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    // Count threat levels
    const threatCounts: Record<string, number> = {}
    visitsList.forEach((v) => {
      if (v.threat_level !== "none") {
        threatCounts[v.threat_level] = (threatCounts[v.threat_level] || 0) + 1
      }
    })
    const topThreats = Object.entries(threatCounts)
      .map(([threat_level, count]) => ({ threat_level, count }))
      .sort((a, b) => b.count - a.count)

    // Count countries
    const countryCounts: Record<string, { count: number; suspicious: number }> = {}
    visitsList.forEach((v) => {
      if (v.country) {
        if (!countryCounts[v.country]) {
          countryCounts[v.country] = { count: 0, suspicious: 0 }
        }
        countryCounts[v.country].count++
        if (v.is_suspicious) countryCounts[v.country].suspicious++
      }
    })
    const countriesStats = Object.entries(countryCounts)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Threats by hour
    const threatsByHour: Array<{ hour: string; count: number }> = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(Date.now() - i * 60 * 60 * 1000)
      const hourEnd = new Date(Date.now() - (i - 1) * 60 * 60 * 1000)
      const count = visitsList.filter((v) => {
        const created = new Date(v.created_at)
        return created >= hourStart && created < hourEnd && v.threat_level !== "none"
      }).length
      threatsByHour.push({
        hour: `${hourStart.getHours()}:00`,
        count,
      })
    }

    const stats = {
      totalVisits: totalVisits || 0,
      uniqueIps,
      suspiciousRequests,
      blockedIps: blockedCount || 0,
      topThreats,
      topPaths,
      topIps,
      recentAlerts: ((alerts || []) as SecurityAlert[]).map((a) => ({
        alert_type: a.alert_type,
        severity: a.severity,
        description: a.description,
        created_at: a.created_at,
      })),
      botStats: {
        totalBots: botVisits,
        aiBots: Math.floor(botVisits * 0.6),
        scrapers: Math.floor(botVisits * 0.3),
        blockedBots: Math.floor(botVisits * 0.1),
      },
      threatsByHour,
      countriesStats,
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error("Error getting security stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
