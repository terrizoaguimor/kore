import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/database"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - all dashboard routes require authentication
  const protectedPaths = [
    "/core",      // The Core (AI)
    "/link",      // KORE Link (CRM)
    "/voice",     // KORE Voice (Telephony)
    "/meet",      // KORE Meet (Video)
    "/pulse",     // KORE Pulse (Marketing)
    "/files",     // KORE Drive
    "/calendar",  // KORE Drive
    "/contacts",  // KORE Drive
    "/talk",      // KORE Drive
    "/office",    // KORE Drive
    "/tasks",     // KORE Drive
    "/notes",     // KORE Drive
    "/dashboard", // KORE OS
    "/settings",  // Settings
    "/admin",     // Admin
  ]
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Auth routes (should redirect to The Core if logged in)
  const authPaths = ["/login", "/register", "/forgot-password"]
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Root path - redirect to The Core if logged in, or login if not
  const isRootPath = request.nextUrl.pathname === "/"

  if (isProtectedPath && !user) {
    // Redirect to login if trying to access protected route without auth
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if ((isAuthPath || isRootPath) && user) {
    // Redirect to The Core if already logged in
    const url = request.nextUrl.clone()
    url.pathname = "/core"
    return NextResponse.redirect(url)
  }

  // Root path is now handled by the page component which shows the landing page
  // for unauthenticated users, so no redirect needed here

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
