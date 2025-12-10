/**
 * Security Middleware Utilities
 * Edge-compatible security checks for Next.js middleware
 */

import { NextRequest, NextResponse } from "next/server"

// Threat detection patterns (simplified for Edge runtime)
const SUSPICIOUS_PATTERNS = [
  // SQL Injection
  /(\b(select|insert|update|delete|drop|union|exec)\b.*\b(from|into|table)\b)/i,
  // XSS
  /<script[\s\S]*?>|javascript:|on\w+\s*=/i,
  // Path traversal
  /\.\.[\/\\]|%2e%2e/i,
  // Sensitive files
  /\.(env|git|htaccess|htpasswd|config|bak|sql)$/i,
]

// Malicious User-Agents
const MALICIOUS_USER_AGENTS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
  'gobuster', 'dirbuster', 'wpscan', 'nuclei',
]

// AI Bots to track
const AI_BOTS = [
  'gptbot', 'claudebot', 'google-extended', 'ccbot',
  'bytespider', 'anthropic-ai', 'amazonbot', 'facebookbot',
]

// Known good bots (don't flag as suspicious)
const GOOD_BOTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'facebot',
]

export interface SecurityCheck {
  blocked: boolean
  reason?: string
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  isBot: boolean
  isAIBot: boolean
  isSuspicious: boolean
  threats: string[]
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  // Fallback (usually 127.0.0.1 in dev)
  return '127.0.0.1'
}

/**
 * Analyze request for security threats (Edge-compatible)
 */
export function analyzeRequestEdge(request: NextRequest): SecurityCheck {
  const path = request.nextUrl.pathname + request.nextUrl.search
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const threats: string[] = []
  let threatLevel: SecurityCheck['threatLevel'] = 'none'
  let blocked = false
  let reason: string | undefined

  // Check for malicious user agents
  for (const malicious of MALICIOUS_USER_AGENTS) {
    if (userAgent.includes(malicious)) {
      threats.push(`Malicious UA: ${malicious}`)
      threatLevel = 'high'
      blocked = true
      reason = `Blocked: Malicious user agent detected (${malicious})`
    }
  }

  // Check path for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(path)) {
      threats.push('Suspicious pattern in URL')
      threatLevel = threatLevel === 'none' ? 'medium' : 'high'
      if (threatLevel === 'high') {
        blocked = true
        reason = 'Blocked: Suspicious request pattern detected'
      }
    }
  }

  // Check for path traversal
  if (path.includes('..') || path.includes('%2e%2e')) {
    threats.push('Path traversal attempt')
    threatLevel = 'critical'
    blocked = true
    reason = 'Blocked: Path traversal attempt'
  }

  // Detect bots
  const isBot = /bot|crawler|spider|scraper|curl|wget|python|java|php/i.test(userAgent)
  const isAIBot = AI_BOTS.some(bot => userAgent.includes(bot))
  const isGoodBot = GOOD_BOTS.some(bot => userAgent.includes(bot))

  // Don't flag good bots as suspicious
  const isSuspicious = threats.length > 0 || (isBot && !isGoodBot && !isAIBot)

  return {
    blocked,
    reason,
    threatLevel,
    isBot,
    isAIBot,
    isSuspicious,
    threats,
  }
}

/**
 * Create blocked response
 */
export function createBlockedResponse(reason: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Access Denied',
      message: reason,
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Block': 'true',
      },
    }
  )
}

/**
 * Create rate limited response
 */
export function createRateLimitResponse(resetIn: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn),
        'X-RateLimit-Reset': String(resetIn),
      },
    }
  )
}

/**
 * Log visit asynchronously (fire-and-forget)
 * This calls the internal API to avoid Edge runtime limitations
 */
export async function logVisitAsync(
  request: NextRequest,
  securityCheck: SecurityCheck,
  responseStatus?: number
): Promise<void> {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent')

  // Skip logging for static assets and internal paths
  const path = request.nextUrl.pathname
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/security') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2)$/)
  ) {
    return
  }

  try {
    // Fire-and-forget: don't await
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/security/log-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip_address: ip,
        user_agent: userAgent,
        path: path,
        method: request.method,
        status_code: responseStatus,
        is_bot: securityCheck.isBot,
        is_suspicious: securityCheck.isSuspicious,
        threat_level: securityCheck.threatLevel,
        detection: {
          isAIBot: securityCheck.isAIBot,
          threats: securityCheck.threats,
        },
      }),
    }).catch(() => {
      // Silently ignore errors - don't block the request
    })
  } catch {
    // Silently ignore
  }
}

/**
 * Check if IP is blocked (calls internal API)
 */
export async function checkIPBlocked(
  request: NextRequest,
  ip: string
): Promise<boolean> {
  try {
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/security/log-visit?ip=${encodeURIComponent(ip)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000), // 1 second timeout
    })

    if (response.ok) {
      const data = await response.json()
      return data.is_blocked === true
    }

    return false
  } catch {
    // On error, don't block - fail open
    return false
  }
}

// Simple in-memory rate limiter for Edge (per-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple rate limiter (Edge-compatible, per-instance)
 */
export function checkRateLimitEdge(
  ip: string,
  endpoint: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds }
  }

  if (entry.count >= maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  const remaining = maxRequests - entry.count
  const resetIn = Math.ceil((entry.resetAt - now) / 1000)

  return { allowed: true, remaining, resetIn }
}

// Rate limit configs
export const RATE_LIMIT_CONFIGS: Record<string, { requests: number; window: number }> = {
  '/api/auth/login': { requests: 5, window: 60 },
  '/api/auth/register': { requests: 3, window: 60 },
  '/api/files/upload': { requests: 20, window: 60 },
  '/api/meet': { requests: 10, window: 60 },
  'default': { requests: 100, window: 60 },
}

/**
 * Get rate limit config for path
 */
export function getRateLimitConfig(path: string): { requests: number; window: number } {
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      return config
    }
  }
  return RATE_LIMIT_CONFIGS.default
}
