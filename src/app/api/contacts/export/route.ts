import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface ContactEmail {
  email: string
  type: string
  is_primary: boolean
}

interface ContactPhone {
  phone: string
  type: string
  is_primary: boolean
}

interface ContactAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  type: string
}

interface ContactWithDetails {
  id: string
  first_name?: string
  last_name?: string
  organization?: string
  job_title?: string
  birthday?: string
  notes?: string
  photo_url?: string
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
}

// Escape special characters for vCard
function escapeVCard(value: string | undefined): string {
  if (!value) return ""
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

// Convert contact to vCard format (vCard 3.0)
function contactToVCard(contact: ContactWithDetails): string {
  const lines: string[] = []

  lines.push("BEGIN:VCARD")
  lines.push("VERSION:3.0")

  // Full name
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ")
  if (fullName) {
    lines.push(`FN:${escapeVCard(fullName)}`)
  }

  // Structured name: N:lastname;firstname;middlename;prefix;suffix
  lines.push(`N:${escapeVCard(contact.last_name)};${escapeVCard(contact.first_name)};;;`)

  // Organization and title
  if (contact.organization) {
    lines.push(`ORG:${escapeVCard(contact.organization)}`)
  }
  if (contact.job_title) {
    lines.push(`TITLE:${escapeVCard(contact.job_title)}`)
  }

  // Emails
  if (contact.emails && contact.emails.length > 0) {
    contact.emails.forEach((email) => {
      const typeParam = email.type?.toUpperCase() || "INTERNET"
      const pref = email.is_primary ? ";PREF" : ""
      lines.push(`EMAIL;TYPE=${typeParam}${pref}:${email.email}`)
    })
  }

  // Phones
  if (contact.phones && contact.phones.length > 0) {
    contact.phones.forEach((phone) => {
      const typeMap: Record<string, string> = {
        mobile: "CELL",
        home: "HOME",
        work: "WORK",
        fax: "FAX",
        other: "VOICE",
      }
      const typeParam = typeMap[phone.type?.toLowerCase()] || "VOICE"
      const pref = phone.is_primary ? ";PREF" : ""
      lines.push(`TEL;TYPE=${typeParam}${pref}:${phone.phone}`)
    })
  }

  // Addresses
  if (contact.addresses && contact.addresses.length > 0) {
    contact.addresses.forEach((address) => {
      const typeParam = address.type?.toUpperCase() || "HOME"
      // ADR format: PO Box;Extended;Street;City;State;Postal;Country
      const adr = [
        "", // PO Box
        "", // Extended
        escapeVCard(address.street),
        escapeVCard(address.city),
        escapeVCard(address.state),
        escapeVCard(address.postal_code),
        escapeVCard(address.country),
      ].join(";")
      lines.push(`ADR;TYPE=${typeParam}:${adr}`)
    })
  }

  // Birthday
  if (contact.birthday) {
    // Format as YYYY-MM-DD or YYYYMMDD
    const bday = contact.birthday.replace(/-/g, "")
    lines.push(`BDAY:${bday}`)
  }

  // Notes
  if (contact.notes) {
    lines.push(`NOTE:${escapeVCard(contact.notes)}`)
  }

  // Photo URL
  if (contact.photo_url) {
    lines.push(`PHOTO;VALUE=URI:${contact.photo_url}`)
  }

  // UID
  lines.push(`UID:${contact.id}`)

  lines.push("END:VCARD")

  return lines.join("\r\n")
}

// GET - Export contacts as vCard
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
    const contactIds = searchParams.get("ids")?.split(",") || []
    const contactBookId = searchParams.get("contact_book_id")

    // Get contact books in the organization
    const { data: contactBooks } = await sb
      .from("contact_books")
      .select("id")
      .eq("organization_id", membership.organization_id)

    const bookIds = contactBooks?.map((b: { id: string }) => b.id) || []

    if (bookIds.length === 0) {
      return new Response("", {
        headers: {
          "Content-Type": "text/vcard",
          "Content-Disposition": 'attachment; filename="contacts.vcf"',
        },
      })
    }

    // Build query
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

    // Filter by specific IDs if provided
    if (contactIds.length > 0) {
      query = query.in("id", contactIds)
    }

    const { data: contacts, error } = await query

    if (error) throw error

    // Convert to vCard format
    const vcards = (contacts || []).map((contact: ContactWithDetails) => contactToVCard(contact))
    const vcardContent = vcards.join("\r\n\r\n")

    // Determine filename
    const filename = contactIds.length === 1
      ? `${contacts[0]?.first_name || "contact"}_${contacts[0]?.last_name || ""}.vcf`.trim().replace(/\s+/g, "_")
      : "contacts.vcf"

    return new Response(vcardContent, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting contacts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
