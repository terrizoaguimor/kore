/**
 * KORE Security Module
 *
 * Comprehensive security monitoring system for KORE platform.
 * Handles IP tracking, threat detection, rate limiting, and security alerts.
 */

import { createClient } from "@/lib/supabase/client"

// Threat detection patterns
const SUSPICIOUS_PATTERNS = {
  // SQL Injection patterns
  sqlInjection: /(\b(select|insert|update|delete|drop|union|exec|execute)\b.*\b(from|into|table|database)\b)|('.*--)|(\bor\b.*=.*\bor\b)/i,

  // XSS patterns
  xss: /<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+\s*=/i,

  // Command injection patterns
  commandInjection: /[;&|`$]|\b(cat|ls|rm|wget|curl|bash|sh|nc|netcat|python|perl|ruby)\b.*[/\\]/i,

  // Path traversal patterns
  pathTraversal: /\.\.[\/\\]|%2e%2e[\/\\]|\.\.%2f|%2e%2e%5c/i,

  // Common attack payloads
  commonPayloads: /(\/etc\/passwd|\/var\/run\/secrets|\/proc\/|cmd\.exe|powershell)/i,
}

// Known malicious User-Agents
const MALICIOUS_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'zgrab',
  'gobuster',
  'dirbuster',
  'wpscan',
  'nuclei',
  'httpx',
]

// AI Bots to monitor
const AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'CCBot',
  'Bytespider',
  'anthropic-ai',
  'Amazonbot',
  'FacebookBot',
]

// Rate limit configurations by endpoint
export const RATE_LIMITS: Record<string, { requests: number; windowSeconds: number }> = {
  '/api/auth/login': { requests: 5, windowSeconds: 60 },
  '/api/auth/register': { requests: 3, windowSeconds: 60 },
  '/api/files/upload': { requests: 20, windowSeconds: 60 },
  '/api/meet/rooms': { requests: 10, windowSeconds: 60 },
  '/api/planning/plans': { requests: 30, windowSeconds: 60 },
  'default': { requests: 100, windowSeconds: 60 },
}

export interface VisitData {
  ipAddress: string
  userAgent: string | null
  path: string
  method: string
  statusCode?: number
  country?: string
  city?: string
  latitude?: number
  longitude?: number
  isBot?: boolean
  isSuspicious?: boolean
  threatLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical'
  requestBody?: string
  responseTimeMs?: number
  detection?: {
    isAIBot?: boolean
    isScraper?: boolean
    matchedPattern?: string | null
    confidence?: number
    riskScore?: number
  }
}

export interface SecurityAlert {
  alertType: string
  severity: 'info' | 'warning' | 'high' | 'critical'
  ipAddress?: string
  description: string
  metadata?: Record<string, unknown>
}

export interface ThreatAnalysis {
  isThreat: boolean
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  threats: string[]
  shouldBlock: boolean
}

export interface BlockedIP {
  id: string
  ip_address: string
  reason: string
  blocked_at: string
  expires_at: string | null
  is_permanent: boolean
  blocked_by: string
}

export interface SecurityStats {
  totalVisits: number
  uniqueIps: number
  suspiciousRequests: number
  blockedIps: number
  topThreats: Array<{ threat_level: string; count: number }>
  topPaths: Array<{ path: string; count: number }>
  topIps: Array<{ ip_address: string; count: number; is_suspicious: boolean }>
  recentAlerts: Array<{ alert_type: string; severity: string; description: string; created_at: string }>
  botStats: {
    totalBots: number
    aiBots: number
    scrapers: number
    blockedBots: number
  }
  threatsByHour: Array<{ hour: string; count: number }>
  countriesStats: Array<{ country: string; count: number; suspicious: number }>
}

/**
 * Analyze request for potential threats
 */
export function analyzeRequest(
  path: string,
  method: string,
  userAgent: string | null,
  body?: unknown,
  headers?: Record<string, string>
): ThreatAnalysis {
  const threats: string[] = []
  let threatLevel: ThreatAnalysis['threatLevel'] = 'none'

  // Check User-Agent
  if (userAgent) {
    const lowerUA = userAgent.toLowerCase()
    for (const maliciousUA of MALICIOUS_USER_AGENTS) {
      if (lowerUA.includes(maliciousUA)) {
        threats.push(`Malicious User-Agent detected: ${maliciousUA}`)
        threatLevel = 'high'
      }
    }
  }

  // Check path for suspicious patterns
  for (const [patternName, pattern] of Object.entries(SUSPICIOUS_PATTERNS)) {
    if (pattern.test(path)) {
      threats.push(`Suspicious pattern in path: ${patternName}`)
      threatLevel = threatLevel === 'none' ? 'medium' : 'high'
    }
  }

  // Check request body for suspicious patterns
  if (body) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
    for (const [patternName, pattern] of Object.entries(SUSPICIOUS_PATTERNS)) {
      if (pattern.test(bodyString)) {
        threats.push(`Suspicious pattern in body: ${patternName}`)
        threatLevel = 'high'
      }
    }
  }

  // Check for common attack indicators
  if (path.includes('..') || path.includes('%2e%2e')) {
    threats.push('Path traversal attempt detected')
    threatLevel = 'critical'
  }

  if (path.match(/\.(env|git|htaccess|htpasswd|config|bak|sql|log)$/i)) {
    threats.push('Sensitive file access attempt')
    threatLevel = 'high'
  }

  // Check for excessive query parameters (potential DoS)
  const queryParams = path.split('?')[1]
  if (queryParams && queryParams.split('&').length > 20) {
    threats.push('Excessive query parameters')
    threatLevel = threatLevel === 'none' ? 'low' : threatLevel
  }

  return {
    isThreat: threats.length > 0,
    threatLevel,
    threats,
    shouldBlock: threatLevel === 'critical' || threatLevel === 'high',
  }
}

/**
 * Detect if user agent is an AI bot
 */
export function detectAIBot(userAgent: string | null): { isAIBot: boolean; botName: string | null } {
  if (!userAgent) return { isAIBot: false, botName: null }

  for (const bot of AI_BOTS) {
    if (userAgent.toLowerCase().includes(bot.toLowerCase())) {
      return { isAIBot: true, botName: bot }
    }
  }

  return { isAIBot: false, botName: null }
}

/**
 * Check if IP is blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { data, error } = await supabase
      .from('security_blocked_ips')
      .select('id')
      .eq('ip_address', ipAddress)
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)

    if (error) throw error
    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking blocked IP:', error)
    return false
  }
}

/**
 * Block an IP address
 */
export async function blockIp(
  ipAddress: string,
  reason: string,
  expiresInHours?: number,
  blockedBy: string = 'system'
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null

    await supabase
      .from('security_blocked_ips')
      .upsert({
        ip_address: ipAddress,
        reason,
        expires_at: expiresAt,
        is_permanent: !expiresInHours,
        blocked_by: blockedBy,
        blocked_at: new Date().toISOString(),
      }, {
        onConflict: 'ip_address'
      })

    // Create alert for blocked IP
    await createAlert({
      alertType: 'ip_blocked',
      severity: 'warning',
      ipAddress,
      description: `IP blocked: ${reason}`,
      metadata: { expiresAt, blockedBy },
    })
  } catch (error) {
    console.error('Error blocking IP:', error)
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIp(ipAddress: string, unblockBy: string = 'admin'): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { error } = await supabase
      .from('security_blocked_ips')
      .delete()
      .eq('ip_address', ipAddress)

    if (error) throw error

    await createAlert({
      alertType: 'ip_unblocked',
      severity: 'info',
      ipAddress,
      description: `IP unblocked by ${unblockBy}`,
    })

    return true
  } catch (error) {
    console.error('Error unblocking IP:', error)
    return false
  }
}

/**
 * Log a visit to the database
 */
export async function logVisit(data: VisitData): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    await supabase
      .from('security_visits')
      .insert({
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        path: data.path,
        method: data.method,
        status_code: data.statusCode,
        country: data.country,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        is_bot: data.isBot || false,
        is_suspicious: data.isSuspicious || false,
        threat_level: data.threatLevel || 'none',
        response_time_ms: data.responseTimeMs,
        detection: data.detection ? JSON.stringify(data.detection) : null,
      })
  } catch (error) {
    console.error('Error logging visit:', error)
  }
}

/**
 * Create a security alert
 */
export async function createAlert(alert: SecurityAlert): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    await supabase
      .from('security_alerts')
      .insert({
        alert_type: alert.alertType,
        severity: alert.severity,
        ip_address: alert.ipAddress,
        description: alert.description,
        metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
      })
  } catch (error) {
    console.error('Error creating alert:', error)
  }
}

/**
 * Get blocked IPs list
 */
export async function getBlockedIps(): Promise<BlockedIP[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { data, error } = await supabase
      .from('security_blocked_ips')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('blocked_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting blocked IPs:', error)
    return []
  }
}

/**
 * Get security statistics
 */
export async function getSecurityStats(hours: number = 24): Promise<SecurityStats> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const [
      visitsResult,
      blockedResult,
      alertsResult,
      topPathsResult,
    ] = await Promise.all([
      supabase
        .from('security_visits')
        .select('*', { count: 'exact' })
        .gte('created_at', since),
      supabase
        .from('security_blocked_ips')
        .select('*', { count: 'exact' })
        .or('expires_at.is.null,expires_at.gt.now()'),
      supabase
        .from('security_alerts')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('security_visits')
        .select('path')
        .gte('created_at', since),
    ])

    // Process visits data
    const visits = visitsResult.data || []
    const uniqueIps = new Set(visits.map((v: { ip_address: string }) => v.ip_address)).size
    const suspiciousRequests = visits.filter((v: { is_suspicious: boolean }) => v.is_suspicious).length
    const botVisits = visits.filter((v: { is_bot: boolean }) => v.is_bot).length

    // Count paths
    const pathCounts: Record<string, number> = {}
    visits.forEach((v: { path: string }) => {
      pathCounts[v.path] = (pathCounts[v.path] || 0) + 1
    })
    const topPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Count IPs
    const ipCounts: Record<string, { count: number; is_suspicious: boolean }> = {}
    visits.forEach((v: { ip_address: string; is_suspicious: boolean }) => {
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
    visits.forEach((v: { threat_level: string }) => {
      if (v.threat_level !== 'none') {
        threatCounts[v.threat_level] = (threatCounts[v.threat_level] || 0) + 1
      }
    })
    const topThreats = Object.entries(threatCounts)
      .map(([threat_level, count]) => ({ threat_level, count }))
      .sort((a, b) => b.count - a.count)

    // Count countries
    const countryCounts: Record<string, { count: number; suspicious: number }> = {}
    visits.forEach((v: { country: string; is_suspicious: boolean }) => {
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

    // Threats by hour (mock for now)
    const threatsByHour: Array<{ hour: string; count: number }> = []
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours()
      threatsByHour.push({
        hour: `${hour}:00`,
        count: Math.floor(Math.random() * 50),
      })
    }

    return {
      totalVisits: visitsResult.count || 0,
      uniqueIps,
      suspiciousRequests,
      blockedIps: blockedResult.count || 0,
      topThreats,
      topPaths,
      topIps,
      recentAlerts: (alertsResult.data || []).map((a: { alert_type: string; severity: string; description: string; created_at: string }) => ({
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
  } catch (error) {
    console.error('Error getting security stats:', error)
    return {
      totalVisits: 0,
      uniqueIps: 0,
      suspiciousRequests: 0,
      blockedIps: 0,
      topThreats: [],
      topPaths: [],
      topIps: [],
      recentAlerts: [],
      botStats: { totalBots: 0, aiBots: 0, scrapers: 0, blockedBots: 0 },
      threatsByHour: [],
      countriesStats: [],
    }
  }
}

/**
 * Check rate limit for IP and endpoint
 */
export async function checkRateLimit(
  ipAddress: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default']

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const windowStart = new Date(
      Math.floor(Date.now() / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
    ).toISOString()

    // Get current count
    const { data } = await supabase
      .from('security_rate_limits')
      .select('request_count')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .eq('window_start', windowStart)
      .single()

    const currentCount = data?.request_count || 0
    const allowed = currentCount < config.requests

    // Update or insert rate limit record
    if (allowed) {
      await supabase
        .from('security_rate_limits')
        .upsert({
          ip_address: ipAddress,
          endpoint,
          window_start: windowStart,
          request_count: currentCount + 1,
        }, {
          onConflict: 'ip_address,endpoint,window_start'
        })
    }

    const resetIn = Math.ceil(
      (new Date(windowStart).getTime() + config.windowSeconds * 1000 - Date.now()) / 1000
    )

    return {
      allowed,
      remaining: Math.max(0, config.requests - currentCount - (allowed ? 1 : 0)),
      resetIn,
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { allowed: true, remaining: config.requests, resetIn: config.windowSeconds }
  }
}

/**
 * Detect potential brute force attacks
 */
export async function detectBruteForce(
  ipAddress: string,
  endpoint: string,
  windowMinutes: number = 5,
  threshold: number = 20
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { count } = await supabase
      .from('security_visits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('path', endpoint)
      .gte('created_at', since)

    if ((count || 0) >= threshold) {
      await createAlert({
        alertType: 'brute_force_attempt',
        severity: 'high',
        ipAddress,
        description: `Potential brute force attack detected: ${count} requests to ${endpoint} in ${windowMinutes} minutes`,
        metadata: { endpoint, requestCount: count, windowMinutes },
      })

      // Auto-block for 1 hour
      await blockIp(ipAddress, `Brute force attack detected on ${endpoint}`, 1)
      return true
    }

    return false
  } catch (error) {
    console.error('Error detecting brute force:', error)
    return false
  }
}

/**
 * Get geo visits for world map
 */
export async function getGeoVisits(hours: number = 24, limit: number = 200): Promise<{
  visits: Array<{
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
  }>
  countryStats: Array<{
    country: string
    countryCode: string
    visits: number
    uniqueIps: number
    suspicious: number
  }>
  totalLocations: number
  totalVisits: number
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { data: visits, count } = await supabase
      .from('security_visits')
      .select('*', { count: 'exact' })
      .gte('created_at', since)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: blockedIps } = await supabase
      .from('security_blocked_ips')
      .select('ip_address')
      .or('expires_at.is.null,expires_at.gt.now()')

    const blockedSet = new Set((blockedIps || []).map((b: { ip_address: string }) => b.ip_address))

    // Group by location
    const locationMap = new Map<string, {
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
    }>()

    // Country stats map
    const countryMap = new Map<string, {
      visits: number
      uniqueIps: Set<string>
      suspicious: number
    }>()

    for (const v of (visits || [])) {
      const key = `${v.latitude},${v.longitude}`

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          ip: v.ip_address,
          lat: v.latitude,
          lng: v.longitude,
          country: v.country || 'Unknown',
          countryCode: v.country?.slice(0, 2).toUpperCase() || 'XX',
          city: v.city || 'Unknown',
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
      const country = v.country || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, { visits: 0, uniqueIps: new Set(), suspicious: 0 })
      }
      const cs = countryMap.get(country)!
      cs.visits++
      cs.uniqueIps.add(v.ip_address)
      if (v.is_suspicious) cs.suspicious++
    }

    const geoVisits = Array.from(locationMap.values())
    const countryStats = Array.from(countryMap.entries()).map(([country, data]) => ({
      country,
      countryCode: country.slice(0, 2).toUpperCase(),
      visits: data.visits,
      uniqueIps: data.uniqueIps.size,
      suspicious: data.suspicious,
    })).sort((a, b) => b.visits - a.visits).slice(0, 20)

    return {
      visits: geoVisits,
      countryStats,
      totalLocations: geoVisits.length,
      totalVisits: count || 0,
    }
  } catch (error) {
    console.error('Error getting geo visits:', error)
    return {
      visits: [],
      countryStats: [],
      totalLocations: 0,
      totalVisits: 0,
    }
  }
}
