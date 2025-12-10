import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// POST - Verify share password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: share, error } = await (supabase as any)
      .from("shares")
      .select("password_hash")
      .eq("token", token)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    // Verify password
    const hashedPassword = hashPassword(password)
    if (hashedPassword !== share.password_hash) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
