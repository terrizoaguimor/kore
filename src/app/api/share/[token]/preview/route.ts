import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// POST - Get preview URL (doesn't increment download counter)
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
        password_hash,
        expires_at,
        file:files(storage_path, mime_type)
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

    // Only allow preview for certain file types
    const mime = share.file?.mime_type || ""
    const isPreviewable = mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/") || mime.includes("pdf")

    if (!isPreviewable || !share.file?.storage_path) {
      return NextResponse.json({ error: "Preview not available" }, { status: 400 })
    }

    // Generate signed URL for preview
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("files")
      .createSignedUrl(share.file.storage_path, 3600)

    if (urlError || !signedUrl) {
      throw new Error("Failed to generate preview URL")
    }

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (error) {
    console.error("Error generating preview:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
