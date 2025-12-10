import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface ParsedEmail {
  email: string
  type: string
  is_primary: boolean
}

interface ParsedPhone {
  phone: string
  type: string
  is_primary: boolean
}

interface ParsedAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  type: string
}

interface ParsedContact {
  first_name?: string
  last_name?: string
  organization?: string
  job_title?: string
  birthday?: string
  notes?: string
  photo_url?: string
  emails: ParsedEmail[]
  phones: ParsedPhone[]
  addresses: ParsedAddress[]
}

// Unescape vCard special characters
function unescapeVCard(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

// Parse a single vCard entry
function parseVCard(vcardText: string): ParsedContact {
  const contact: ParsedContact = {
    emails: [],
    phones: [],
    addresses: [],
  }

  // Split into lines and handle line folding (lines starting with space/tab are continuations)
  const lines: string[] = []
  const rawLines = vcardText.split(/\r?\n/)
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    if (line.startsWith(" ") || line.startsWith("\t")) {
      // Continuation of previous line
      if (lines.length > 0) {
        lines[lines.length - 1] += line.substring(1)
      }
    } else {
      lines.push(line)
    }
  }

  for (const line of lines) {
    if (!line || line.startsWith("BEGIN:") || line.startsWith("END:") || line.startsWith("VERSION:")) {
      continue
    }

    // Parse property name and value
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const propertyPart = line.substring(0, colonIndex)
    const value = unescapeVCard(line.substring(colonIndex + 1))

    // Extract property name and parameters
    const semiIndex = propertyPart.indexOf(";")
    const propertyName = semiIndex === -1 ? propertyPart : propertyPart.substring(0, semiIndex)
    const paramsStr = semiIndex === -1 ? "" : propertyPart.substring(semiIndex + 1)

    // Parse parameters
    const params: Record<string, string> = {}
    if (paramsStr) {
      paramsStr.split(";").forEach((param) => {
        const [key, val] = param.split("=")
        if (key && val) {
          params[key.toUpperCase()] = val.toUpperCase()
        } else if (key) {
          // Some params are just values like "PREF" or type names
          params[key.toUpperCase()] = "TRUE"
        }
      })
    }

    switch (propertyName.toUpperCase()) {
      case "FN":
        // Full name - used as fallback
        if (!contact.first_name && !contact.last_name) {
          const parts = value.split(" ")
          contact.first_name = parts[0]
          contact.last_name = parts.slice(1).join(" ")
        }
        break

      case "N":
        // Structured name: lastname;firstname;middle;prefix;suffix
        const nameParts = value.split(";")
        contact.last_name = nameParts[0] || undefined
        contact.first_name = nameParts[1] || undefined
        // Could also parse middle name, prefix, suffix if needed
        break

      case "ORG":
        contact.organization = value
        break

      case "TITLE":
        contact.job_title = value
        break

      case "EMAIL":
        const emailType = params.TYPE?.toLowerCase() || "personal"
        const isPrimaryEmail = params.PREF === "TRUE" || params.PREF === "1"
        contact.emails.push({
          email: value,
          type: emailType === "internet" ? "personal" : emailType,
          is_primary: isPrimaryEmail,
        })
        break

      case "TEL":
        const phoneTypeMap: Record<string, string> = {
          CELL: "mobile",
          HOME: "home",
          WORK: "work",
          FAX: "fax",
          VOICE: "other",
        }
        const rawPhoneType = params.TYPE || "VOICE"
        const phoneType = phoneTypeMap[rawPhoneType] || "other"
        const isPrimaryPhone = params.PREF === "TRUE" || params.PREF === "1"
        contact.phones.push({
          phone: value,
          type: phoneType,
          is_primary: isPrimaryPhone,
        })
        break

      case "ADR":
        // Format: PO Box;Extended;Street;City;State;Postal;Country
        const adrParts = value.split(";")
        const addrType = (params.TYPE?.toLowerCase() || "home")
        contact.addresses.push({
          street: adrParts[2] || undefined,
          city: adrParts[3] || undefined,
          state: adrParts[4] || undefined,
          postal_code: adrParts[5] || undefined,
          country: adrParts[6] || undefined,
          type: addrType,
        })
        break

      case "BDAY":
        // Format can be YYYYMMDD or YYYY-MM-DD
        let bday = value.replace(/[^0-9]/g, "")
        if (bday.length >= 8) {
          contact.birthday = `${bday.substring(0, 4)}-${bday.substring(4, 6)}-${bday.substring(6, 8)}`
        }
        break

      case "NOTE":
        contact.notes = value
        break

      case "PHOTO":
        if (params.VALUE === "URI" || value.startsWith("http")) {
          contact.photo_url = value
        }
        break
    }
  }

  // Set first email/phone as primary if none marked
  if (contact.emails.length > 0 && !contact.emails.some((e) => e.is_primary)) {
    contact.emails[0].is_primary = true
  }
  if (contact.phones.length > 0 && !contact.phones.some((p) => p.is_primary)) {
    contact.phones[0].is_primary = true
  }

  return contact
}

// Split vCard file into individual entries
function splitVCards(content: string): string[] {
  const vcards: string[] = []
  const regex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    vcards.push(match[0])
  }
  return vcards
}

// POST - Import contacts from vCard
export async function POST(request: NextRequest) {
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

    // Get or create default contact book
    let { data: contactBooks } = await sb
      .from("contact_books")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("is_default", true)
      .limit(1)

    let contactBookId: string

    if (!contactBooks || contactBooks.length === 0) {
      // Create default contact book
      const { data: newBook, error: createError } = await sb
        .from("contact_books")
        .insert({
          organization_id: membership.organization_id,
          owner_id: user.id,
          name: "Contacts",
          is_default: true,
        })
        .select()
        .single()

      if (createError) throw createError
      contactBookId = newBook.id
    } else {
      contactBookId = contactBooks[0].id
    }

    // Parse the request body
    const contentType = request.headers.get("content-type") || ""
    let vcardContent: string

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }
      vcardContent = await file.text()
    } else {
      const body = await request.json()
      vcardContent = body.vcard
    }

    if (!vcardContent) {
      return NextResponse.json({ error: "No vCard content provided" }, { status: 400 })
    }

    // Parse vCards
    const vcardStrings = splitVCards(vcardContent)
    if (vcardStrings.length === 0) {
      return NextResponse.json({ error: "No valid vCards found" }, { status: 400 })
    }

    const parsedContacts = vcardStrings.map(parseVCard)

    // Import contacts
    const imported: string[] = []
    const errors: string[] = []

    for (const contactData of parsedContacts) {
      try {
        // Skip empty contacts
        if (!contactData.first_name && !contactData.last_name && !contactData.organization) {
          errors.push("Skipped contact with no name or organization")
          continue
        }

        // Create the contact
        const { data: contact, error: contactError } = await sb
          .from("contacts")
          .insert({
            contact_book_id: contactBookId,
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            organization: contactData.organization,
            job_title: contactData.job_title,
            birthday: contactData.birthday,
            notes: contactData.notes,
            photo_url: contactData.photo_url,
          })
          .select()
          .single()

        if (contactError) {
          errors.push(`Failed to import ${contactData.first_name || ""} ${contactData.last_name || ""}: ${contactError.message}`)
          continue
        }

        // Add emails
        if (contactData.emails.length > 0) {
          await sb.from("contact_emails").insert(
            contactData.emails.map((e) => ({
              contact_id: contact.id,
              email: e.email,
              type: e.type,
              is_primary: e.is_primary,
            }))
          )
        }

        // Add phones
        if (contactData.phones.length > 0) {
          await sb.from("contact_phones").insert(
            contactData.phones.map((p) => ({
              contact_id: contact.id,
              phone: p.phone,
              type: p.type,
              is_primary: p.is_primary,
            }))
          )
        }

        // Add addresses
        if (contactData.addresses.length > 0) {
          const validAddresses = contactData.addresses.filter(
            (a) => a.street || a.city || a.state || a.postal_code || a.country
          )
          if (validAddresses.length > 0) {
            await sb.from("contact_addresses").insert(
              validAddresses.map((a) => ({
                contact_id: contact.id,
                street: a.street,
                city: a.city,
                state: a.state,
                postal_code: a.postal_code,
                country: a.country,
                type: a.type,
              }))
            )
          }
        }

        imported.push(contact.id)
      } catch (err) {
        const name = `${contactData.first_name || ""} ${contactData.last_name || ""}`.trim() || "Unknown"
        errors.push(`Failed to import ${name}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
      total: vcardStrings.length,
    })
  } catch (error) {
    console.error("Error importing contacts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
