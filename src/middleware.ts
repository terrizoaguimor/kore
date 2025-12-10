import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import {
  getClientIP,
  analyzeRequestEdge,
  createBlockedResponse,
  createRateLimitResponse,
  logVisitAsync,
  checkIPBlocked,
  checkRateLimitEdge,
  getRateLimitConfig,
} from "@/lib/security/middleware"

// Paths that should skip security checks entirely
const SKIP_SECURITY_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/security', // Allow security API to work
  '/api/webhooks',
]

// Paths that need strict rate limiting
const RATE_LIMITED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/files/upload',
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip security for static assets and internal paths
  if (SKIP_SECURITY_PATHS.some(p => path.startsWith(p))) {
    return await updateSession(request)
  }

  // Skip security for static files
  if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|webp)$/)) {
    return await updateSession(request)
  }

  const ip = getClientIP(request)

  // 1. Check if IP is blocked (async but fast due to caching)
  try {
    const isBlocked = await checkIPBlocked(request, ip)
    if (isBlocked) {
      return createBlockedResponse('Your IP address has been blocked')
    }
  } catch {
    // Continue if check fails - fail open
  }

  // 2. Analyze request for threats
  const securityCheck = analyzeRequestEdge(request)

  // 3. Block high-threat requests immediately
  if (securityCheck.blocked) {
    // Log the blocked request
    logVisitAsync(request, securityCheck, 403)
    return createBlockedResponse(securityCheck.reason || 'Access denied')
  }

  // 4. Rate limiting for sensitive endpoints
  if (RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    const config = getRateLimitConfig(path)
    const rateLimit = checkRateLimitEdge(ip, path, config.requests, config.window)

    if (!rateLimit.allowed) {
      // Log rate-limited request
      logVisitAsync(request, { ...securityCheck, isSuspicious: true }, 429)
      return createRateLimitResponse(rateLimit.resetIn)
    }
  }

  // 5. Continue with session update (auth middleware)
  const response = await updateSession(request)

  // 6. Log the visit asynchronously (fire-and-forget)
  logVisitAsync(request, securityCheck, response.status)

  // 7. Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
