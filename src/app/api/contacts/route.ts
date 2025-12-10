import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization
    const { data: membership } = await sb
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const contactBookId = searchParams.get("contact_book_id")
    const search = searchParams.get("search")

    // First get contact books in the organization
    const { data: contactBooks } = await sb
      .from("contact_books")
      .select("id")
      .eq("organization_id", membership.organization_id)

    const bookIds = contactBooks?.map((b: { id: string }) => b.id) || []

    if (bookIds.length === 0) {
      return NextResponse.json({ contacts: [] })
    }

    // Build contacts query
    let query = sb
      .from("contacts")
      .select(`
        *,
        emails:contact_emails(*),
        phones:contact_phones(*),
        addresses:contact_addresses(*)
      `)
      .in("contact_book_id", contactBookId ? [contactBookId] : bookIds)
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,organization.ilike.%${search}%`)
    }

    const { data: contacts, error } = await query

    if (error) throw error

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const body = await request.json()
    const {
      contact_book_id,
      first_name,
      last_name,
      organization,
      job_title,
      birthday,
      notes,
      emails,
      phones,
      addresses,
    } = body

    if (!contact_book_id) {
      return NextResponse.json({ error: "Contact book ID required" }, { status: 400 })
    }

    // Create the contact
    const { data: contact, error: contactError } = await sb
      .from("contacts")
      .insert({
        contact_book_id,
        first_name,
        last_name,
        organization,
        job_title,
        birthday,
        notes,
      })
      .select()
      .single()

    if (contactError) throw contactError

    // Add emails
    if (emails && emails.length > 0) {
      await sb
        .from("contact_emails")
        .insert(
          emails.map((e: { email: string; type: string; is_primary: boolean }) => ({
            contact_id: contact.id,
            email: e.email,
            type: e.type || "personal",
            is_primary: e.is_primary || false,
          }))
        )
    }

    // Add phones
    if (phones && phones.length > 0) {
      await sb
        .from("contact_phones")
        .insert(
          phones.map((p: { phone: string; type: string; is_primary: boolean }) => ({
            contact_id: contact.id,
            phone: p.phone,
            type: p.type || "mobile",
            is_primary: p.is_primary || false,
          }))
        )
    }

    // Add addresses
    if (addresses && addresses.length > 0) {
      await sb
        .from("contact_addresses")
        .insert(
          addresses.map((a: { street?: string; city?: string; state?: string; postal_code?: string; country?: string; type: string }) => ({
            contact_id: contact.id,
            street: a.street,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            country: a.country,
            type: a.type || "home",
          }))
        )
    }

    // Fetch the complete contact
    const { data: fullContact } = await sb
      .from("contacts")
      .select(`
        *,
        emails:contact_emails(*),
        phones:contact_phones(*),
        addresses:contact_addresses(*)
      `)
      .eq("id", contact.id)
      .single()

    return NextResponse.json({ contact: fullContact })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
