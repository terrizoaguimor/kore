import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get contact details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact, error } = await (supabase as any)
      .from("contacts")
      .select(`
        *,
        emails:contact_emails(*),
        phones:contact_phones(*),
        addresses:contact_addresses(*)
      `)
      .eq("id", id)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const {
      first_name,
      last_name,
      organization,
      job_title,
      birthday,
      notes,
      is_starred,
      emails,
      phones,
      addresses,
    } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (organization !== undefined) updateData.organization = organization
    if (job_title !== undefined) updateData.job_title = job_title
    if (birthday !== undefined) updateData.birthday = birthday
    if (notes !== undefined) updateData.notes = notes
    if (is_starred !== undefined) updateData.is_starred = is_starred

    // Update main contact
    const { error: contactError } = await sb
      .from("contacts")
      .update(updateData)
      .eq("id", id)

    if (contactError) throw contactError

    // Update emails if provided
    if (emails !== undefined) {
      await sb.from("contact_emails").delete().eq("contact_id", id)
      if (emails.length > 0) {
        await sb.from("contact_emails").insert(
          emails.map((e: { email: string; type: string; is_primary: boolean }) => ({
            contact_id: id,
            email: e.email,
            type: e.type || "personal",
            is_primary: e.is_primary || false,
          }))
        )
      }
    }

    // Update phones if provided
    if (phones !== undefined) {
      await sb.from("contact_phones").delete().eq("contact_id", id)
      if (phones.length > 0) {
        await sb.from("contact_phones").insert(
          phones.map((p: { phone: string; type: string; is_primary: boolean }) => ({
            contact_id: id,
            phone: p.phone,
            type: p.type || "mobile",
            is_primary: p.is_primary || false,
          }))
        )
      }
    }

    // Update addresses if provided
    if (addresses !== undefined) {
      await sb.from("contact_addresses").delete().eq("contact_id", id)
      if (addresses.length > 0) {
        await sb.from("contact_addresses").insert(
          addresses.map((a: { street?: string; city?: string; state?: string; postal_code?: string; country?: string; type: string }) => ({
            contact_id: id,
            street: a.street,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            country: a.country,
            type: a.type || "home",
          }))
        )
      }
    }

    // Fetch updated contact
    const { data: contact } = await sb
      .from("contacts")
      .select(`
        *,
        emails:contact_emails(*),
        phones:contact_phones(*),
        addresses:contact_addresses(*)
      `)
      .eq("id", id)
      .single()

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Delete related data first (cascade should handle this, but being explicit)
    await sb.from("contact_emails").delete().eq("contact_id", id)
    await sb.from("contact_phones").delete().eq("contact_id", id)
    await sb.from("contact_addresses").delete().eq("contact_id", id)

    // Delete the contact
    const { error } = await sb.from("contacts").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
