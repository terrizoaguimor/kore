import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Helper to check file access
async function canAccessFile(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, fileId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: file } = await (supabase as any)
    .from("files")
    .select(`
      *,
      organization:organizations(id, name)
    `)
    .eq("id", fileId)
    .single()

  if (!file) return null

  // Check if user is member of the organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
    .from("organization_members")
    .select("id")
    .eq("organization_id", file.organization_id)
    .eq("user_id", user.id)
    .single()

  if (!membership) return null

  return { file, user }
}

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Generate share token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// GET - List shares for a file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const access = await canAccessFile(supabase, id)
    if (!access) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shares, error } = await (supabase as any)
      .from("shares")
      .select("*")
      .eq("file_id", id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ shares })
  } catch (error) {
    console.error("Error fetching shares:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new share
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const access = await canAccessFile(supabase, id)
    if (!access) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 })
    }

    const body = await request.json()
    const {
      permission = "view",
      password,
      expires_at,
      max_downloads,
      shared_with_email,
    } = body

    // Validate permission
    if (!["view", "edit", "upload"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission" }, { status: 400 })
    }

    // Create share record
    const shareData: Record<string, unknown> = {
      file_id: id,
      shared_by: access.user.id,
      token: generateToken(),
      permission,
    }

    if (password) {
      shareData.password_hash = hashPassword(password)
    }

    if (expires_at) {
      shareData.expires_at = expires_at
    }

    if (max_downloads) {
      shareData.max_downloads = max_downloads
    }

    if (shared_with_email) {
      shareData.shared_with_email = shared_with_email
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: share, error } = await (supabase as any)
      .from("shares")
      .insert(shareData)
      .select()
      .single()

    if (error) throw error

    // Generate the share URL
    const url = `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL}/share/${share.token}`

    return NextResponse.json({ share, url })
  } catch (error) {
    console.error("Error creating share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
