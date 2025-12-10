import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get share info (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: share, error } = await (supabase as any)
      .from("shares")
      .select(`
        id,
        permission,
        password_hash,
        expires_at,
        download_count,
        max_downloads,
        file:files(id, name, type, mime_type, size)
      `)
      .eq("token", token)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
    }

    // Check download limit
    if (share.max_downloads && share.download_count >= share.max_downloads) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 410 })
    }

    // Return share info (without exposing password hash)
    return NextResponse.json({
      id: share.id,
      file: share.file,
      permission: share.permission,
      requires_password: !!share.password_hash,
      expires_at: share.expires_at,
      download_count: share.download_count,
      max_downloads: share.max_downloads,
    })
  } catch (error) {
    console.error("Error fetching share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
