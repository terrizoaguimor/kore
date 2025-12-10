import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// POST - Get download URL and increment counter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params
    const body = await request.json().catch(() => ({}))
    const { password } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: share, error } = await (supabase as any)
      .from("shares")
      .select(`
        id,
        password_hash,
        expires_at,
        download_count,
        max_downloads,
        file:files(id, name, storage_path)
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

    // Verify password if required
    if (share.password_hash) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 })
      }
      const hashedPassword = hashPassword(password)
      if (hashedPassword !== share.password_hash) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
      }
    }

    // Get file storage path
    if (!share.file?.storage_path) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("files")
      .createSignedUrl(share.file.storage_path, 3600) // 1 hour

    if (urlError || !signedUrl) {
      throw new Error("Failed to generate download URL")
    }

    // Increment download count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("shares")
      .update({ download_count: share.download_count + 1 })
      .eq("id", share.id)

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (error) {
    console.error("Error generating download:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
