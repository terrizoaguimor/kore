import { NextRequest, NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

interface GeoVisit {
  ip: string
  lat: number
  lng: number
  country: string
  countryCode: string
  city: string
  count: number
  lastVisit: string
  isSuspicious: boolean
  isBlocked: boolean
}

interface CountryStat {
  country: string
  countryCode: string
  visits: number
  uniqueIps: number
  suspicious: number
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant context with admin validation
    const { isValid, context, error } = await getTenantContext()

    if (!isValid || !context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (!context.isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get("hours") || "24")
    const limit = parseInt(searchParams.get("limit") || "200")
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Get visits with geo data filtered by organization
    const { data: visits, count } = await sb
      .from("security_visits")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organizationId)
      .gte("created_at", since)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Get blocked IPs for this organization
    const { data: blockedIps } = await sb
      .from("security_blocked_ips")
      .select("ip_address")
      .eq("organization_id", context.organizationId)
      .or("expires_at.is.null,expires_at.gt.now()")

    const blockedSet = new Set((blockedIps || []).map((b: { ip_address: string }) => b.ip_address))

    // Group by location
    const locationMap = new Map<string, GeoVisit>()
    const countryMap = new Map<string, { visits: number; uniqueIps: Set<string>; suspicious: number }>()

    for (const v of (visits || [])) {
      const key = `${v.latitude},${v.longitude}`

      if (!locationMap.has(key)) {
        const countryCode = getCountryCode(v.country)
        locationMap.set(key, {
          ip: v.ip_address,
          lat: parseFloat(v.latitude),
          lng: parseFloat(v.longitude),
          country: v.country || "Unknown",
          countryCode,
          city: v.city || "Unknown",
          count: 0,
          lastVisit: v.created_at,
          isSuspicious: false,
          isBlocked: false,
        })
      }

      const loc = locationMap.get(key)!
      loc.count++
      if (v.is_suspicious) loc.isSuspicious = true
      if (blockedSet.has(v.ip_address)) loc.isBlocked = true
      if (new Date(v.created_at) > new Date(loc.lastVisit)) {
        loc.lastVisit = v.created_at
      }

      // Update country stats
      const country = v.country || "Unknown"
      if (!countryMap.has(country)) {
        countryMap.set(country, { visits: 0, uniqueIps: new Set(), suspicious: 0 })
      }
      const cs = countryMap.get(country)!
      cs.visits++
      cs.uniqueIps.add(v.ip_address)
      if (v.is_suspicious) cs.suspicious++
    }

    const geoVisits = Array.from(locationMap.values())
    const countryStats: CountryStat[] = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        countryCode: getCountryCode(country),
        visits: data.visits,
        uniqueIps: data.uniqueIps.size,
        suspicious: data.suspicious,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20)

    // Generate heat map data
    const heatMap = geoVisits.map((v) => ({
      lat: v.lat,
      lng: v.lng,
      intensity: v.isSuspicious ? 0.8 : v.isBlocked ? 1 : 0.2,
      count: v.count,
    }))

    return NextResponse.json({
      data: {
        visits: geoVisits,
        heatMap,
        countryStats,
        totalLocations: geoVisits.length,
        totalVisits: count || 0,
      },
    })
  } catch (error) {
    console.error("Error getting geo visits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper to get country code from country name
function getCountryCode(country: string | null): string {
  if (!country) return "XX"

  const countryCodes: Record<string, string> = {
    "United States": "US",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Germany": "DE",
    "France": "FR",
    "Spain": "ES",
    "Italy": "IT",
    "Netherlands": "NL",
    "Australia": "AU",
    "Japan": "JP",
    "China": "CN",
    "India": "IN",
    "Brazil": "BR",
    "Mexico": "MX",
    "Argentina": "AR",
    "Colombia": "CO",
    "Chile": "CL",
    "Peru": "PE",
    "Russia": "RU",
    "South Korea": "KR",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Taiwan": "TW",
    "Indonesia": "ID",
    "Thailand": "TH",
    "Vietnam": "VN",
    "Philippines": "PH",
    "Malaysia": "MY",
    "Poland": "PL",
    "Sweden": "SE",
    "Norway": "NO",
    "Denmark": "DK",
    "Finland": "FI",
    "Switzerland": "CH",
    "Austria": "AT",
    "Belgium": "BE",
    "Portugal": "PT",
    "Ireland": "IE",
    "Czech Republic": "CZ",
    "Romania": "RO",
    "Ukraine": "UA",
    "Turkey": "TR",
    "Israel": "IL",
    "South Africa": "ZA",
    "Egypt": "EG",
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    "New Zealand": "NZ",
  }

  return countryCodes[country] || country.slice(0, 2).toUpperCase()
}
