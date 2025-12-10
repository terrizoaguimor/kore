/**
 * IP Geo-location Service
 * Uses ip-api.com (free tier: 45 requests/minute)
 */

interface GeoLocation {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  latitude: number
  longitude: number
  isp: string
  org: string
  isProxy: boolean
  isHosting: boolean
}

// Simple in-memory cache to avoid excessive API calls
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get geo-location data for an IP address
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // Skip private/local IPs
  if (isPrivateIP(ip)) {
    return null
  }

  // Check cache first
  const cached = geoCache.get(ip)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    // Using ip-api.com (free, no API key required)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,isp,org,proxy,hosting`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status === 'fail') {
      return null
    }

    const geoData: GeoLocation = {
      ip,
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      region: data.region || '',
      city: data.city || 'Unknown',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      isp: data.isp || '',
      org: data.org || '',
      isProxy: data.proxy || false,
      isHosting: data.hosting || false,
    }

    // Cache the result
    geoCache.set(ip, { data: geoData, timestamp: Date.now() })

    return geoData
  } catch (error) {
    console.error('Error getting geo location:', error)
    return null
  }
}

/**
 * Check if IP is a private/local address
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,                    // Loopback
    /^10\./,                     // Class A private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
    /^192\.168\./,               // Class C private
    /^169\.254\./,               // Link-local
    /^0\./,                      // Current network
    /^::1$/,                     // IPv6 loopback
    /^fc00:/i,                   // IPv6 private
    /^fe80:/i,                   // IPv6 link-local
  ]

  return privateRanges.some(range => range.test(ip))
}

/**
 * Batch geo-location lookup (for multiple IPs)
 */
export async function batchGeoLocation(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>()
  const uncachedIps: string[] = []

  // Check cache first
  for (const ip of ips) {
    if (isPrivateIP(ip)) continue

    const cached = geoCache.get(ip)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(ip, cached.data)
    } else {
      uncachedIps.push(ip)
    }
  }

  // Batch lookup for uncached IPs (ip-api.com supports batch)
  if (uncachedIps.length > 0) {
    try {
      // ip-api.com batch endpoint (max 100 IPs)
      const batchIps = uncachedIps.slice(0, 100)
      const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,region,city,lat,lon,isp,org,proxy,hosting', {
        method: 'POST',
        body: JSON.stringify(batchIps),
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()

        for (const item of data) {
          if (item.status === 'success') {
            const geoData: GeoLocation = {
              ip: item.query,
              country: item.country || 'Unknown',
              countryCode: item.countryCode || 'XX',
              region: item.region || '',
              city: item.city || 'Unknown',
              latitude: item.lat || 0,
              longitude: item.lon || 0,
              isp: item.isp || '',
              org: item.org || '',
              isProxy: item.proxy || false,
              isHosting: item.hosting || false,
            }

            results.set(item.query, geoData)
            geoCache.set(item.query, { data: geoData, timestamp: Date.now() })
          }
        }
      }
    } catch (error) {
      console.error('Error in batch geo lookup:', error)
    }
  }

  return results
}

/**
 * Clear geo cache (for testing/maintenance)
 */
export function clearGeoCache(): void {
  geoCache.clear()
}
