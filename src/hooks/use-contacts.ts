"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import type { Contact, ContactBook, ContactEmail, ContactPhone, ContactAddress } from "@/types/database"
import { toast } from "sonner"

interface UseContactsOptions {
  contactBookId?: string
}

interface CreateContactData {
  first_name?: string
  last_name?: string
  organization?: string
  job_title?: string
  birthday?: string
  notes?: string
  emails?: { email: string; type: string; is_primary: boolean }[]
  phones?: { phone: string; type: string; is_primary: boolean }[]
  addresses?: {
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    type: string
  }[]
}

interface UpdateContactData extends Partial<CreateContactData> {
  id: string
}

interface ContactWithDetails extends Contact {
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
}

// Helper to get untyped supabase client for database operations
const getDb = (supabase: ReturnType<typeof createClient>) => {
  return supabase as any
}

export function useContacts(options: UseContactsOptions = {}) {
  const { organization, user } = useAuthStore()
  const [contactBooks, setContactBooks] = useState<ContactBook[]>([])
  const [contacts, setContacts] = useState<ContactWithDetails[]>([])
  const [selectedContactBook, setSelectedContactBook] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createClient()
  const db = getDb(supabase)

  // Fetch all contact books for the organization
  const fetchContactBooks = useCallback(async () => {
    if (!organization) return []

    try {
      const { data, error } = await db
        .from("contact_books")
        .select("*")
        .eq("organization_id", organization.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true })

      if (error) throw error
      setContactBooks(data || [])
      return data || []
    } catch (error) {
      console.error("Error fetching contact books:", error)
      toast.error("Failed to load contact books")
      return []
    }
  }, [organization, db])

  // Ensure default contact book exists and fetch contacts
  const ensureDefaultContactBook = useCallback(async () => {
    if (!organization || !user) return null

    const books = await fetchContactBooks()
    let contactBook = null

    if (books && books.length > 0) {
      contactBook = books[0]
      setSelectedContactBook(books[0].id)
    } else {
      // Create default contact book if none exists
      try {
        const { data, error } = await db
          .from("contact_books")
          .insert({
            organization_id: organization.id,
            owner_id: user.id,
            name: "Contacts",
            is_default: true,
          })
          .select()
          .single()

        if (error) throw error
        setContactBooks([data])
        setSelectedContactBook(data.id)
        contactBook = data
      } catch (error) {
        console.error("Error creating default contact book:", error)
        return null
      }
    }

    // Fetch contacts immediately using the contact book ID
    // This avoids the race condition where selectedContactBook state isn't updated yet
    if (contactBook) {
      setIsLoading(true)
      try {
        const { data, error } = await db
          .from("contacts")
          .select(`
            *,
            emails:contact_emails(*),
            phones:contact_phones(*),
            addresses:contact_addresses(*)
          `)
          .eq("contact_book_id", contactBook.id)
          .order("first_name", { ascending: true })
          .order("last_name", { ascending: true })

        if (error) throw error
        setContacts(data || [])
      } catch (error) {
        console.error("Error fetching contacts:", error)
        toast.error("Failed to load contacts")
      } finally {
        setIsLoading(false)
      }
    }

    return contactBook
  }, [organization, user, db, fetchContactBooks])

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!selectedContactBook) return

    setIsLoading(true)
    try {
      const { data, error } = await db
        .from("contacts")
        .select(`
          *,
          emails:contact_emails(*),
          phones:contact_phones(*),
          addresses:contact_addresses(*)
        `)
        .eq("contact_book_id", selectedContactBook)
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast.error("Failed to load contacts")
    } finally {
      setIsLoading(false)
    }
  }, [selectedContactBook, db])

  // Create a new contact
  const createContact = useCallback(async (contactData: CreateContactData) => {
    if (!selectedContactBook) return null

    try {
      // Create the contact
      const { data: contact, error: contactError } = await db
        .from("contacts")
        .insert({
          contact_book_id: selectedContactBook,
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          organization: contactData.organization,
          job_title: contactData.job_title,
          birthday: contactData.birthday,
          notes: contactData.notes,
        })
        .select()
        .single()

      if (contactError) throw contactError

      // Add emails
      if (contactData.emails && contactData.emails.length > 0) {
        const { error: emailError } = await db
          .from("contact_emails")
          .insert(
            contactData.emails.map((e) => ({
              contact_id: contact.id,
              email: e.email,
              type: e.type,
              is_primary: e.is_primary,
            }))
          )
        if (emailError) console.error("Error adding emails:", emailError)
      }

      // Add phones
      if (contactData.phones && contactData.phones.length > 0) {
        const { error: phoneError } = await db
          .from("contact_phones")
          .insert(
            contactData.phones.map((p) => ({
              contact_id: contact.id,
              phone: p.phone,
              type: p.type,
              is_primary: p.is_primary,
            }))
          )
        if (phoneError) console.error("Error adding phones:", phoneError)
      }

      // Add addresses
      if (contactData.addresses && contactData.addresses.length > 0) {
        const { error: addressError } = await db
          .from("contact_addresses")
          .insert(
            contactData.addresses.map((a) => ({
              contact_id: contact.id,
              street: a.street,
              city: a.city,
              state: a.state,
              postal_code: a.postal_code,
              country: a.country,
              type: a.type,
            }))
          )
        if (addressError) console.error("Error adding addresses:", addressError)
      }

      toast.success("Contact created")
      await fetchContacts()
      return contact
    } catch (error) {
      console.error("Error creating contact:", error)
      toast.error("Failed to create contact")
      return null
    }
  }, [selectedContactBook, db, fetchContacts])

  // Update a contact
  const updateContact = useCallback(async (contactData: UpdateContactData) => {
    try {
      const { id, emails, phones, addresses, ...updateData } = contactData

      // Update main contact data
      const { data: contact, error: contactError } = await db
        .from("contacts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (contactError) throw contactError

      // Update emails - delete existing and insert new
      if (emails) {
        await db.from("contact_emails").delete().eq("contact_id", id)
        if (emails.length > 0) {
          await db.from("contact_emails").insert(
            emails.map((e) => ({
              contact_id: id,
              email: e.email,
              type: e.type,
              is_primary: e.is_primary,
            }))
          )
        }
      }

      // Update phones
      if (phones) {
        await db.from("contact_phones").delete().eq("contact_id", id)
        if (phones.length > 0) {
          await db.from("contact_phones").insert(
            phones.map((p) => ({
              contact_id: id,
              phone: p.phone,
              type: p.type,
              is_primary: p.is_primary,
            }))
          )
        }
      }

      // Update addresses
      if (addresses) {
        await db.from("contact_addresses").delete().eq("contact_id", id)
        if (addresses.length > 0) {
          await db.from("contact_addresses").insert(
            addresses.map((a) => ({
              contact_id: id,
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

      toast.success("Contact updated")
      await fetchContacts()
      return contact
    } catch (error) {
      console.error("Error updating contact:", error)
      toast.error("Failed to update contact")
      return null
    }
  }, [db, fetchContacts])

  // Delete a contact
  const deleteContact = useCallback(async (contactId: string) => {
    try {
      const { error } = await db
        .from("contacts")
        .delete()
        .eq("id", contactId)

      if (error) throw error

      setContacts((prev) => prev.filter((c) => c.id !== contactId))
      toast.success("Contact deleted")
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast.error("Failed to delete contact")
    }
  }, [db])

  // Toggle star
  const toggleStar = useCallback(async (contact: ContactWithDetails) => {
    try {
      const { data, error } = await db
        .from("contacts")
        .update({ is_starred: !contact.is_starred })
        .eq("id", contact.id)
        .select()
        .single()

      if (error) throw error

      setContacts((prev) =>
        prev.map((c) => c.id === contact.id ? { ...c, is_starred: data.is_starred } : c)
      )
      toast.success(data.is_starred ? "Added to favorites" : "Removed from favorites")
    } catch (error) {
      console.error("Error toggling star:", error)
      toast.error("Failed to update favorite status")
    }
  }, [db])

  // Filter contacts by search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.toLowerCase()
    const org = (contact.organization || "").toLowerCase()
    const emails = contact.emails?.map((e) => e.email.toLowerCase()).join(" ") || ""
    const phones = contact.phones?.map((p) => p.phone).join(" ") || ""

    return (
      fullName.includes(query) ||
      org.includes(query) ||
      emails.includes(query) ||
      phones.includes(query)
    )
  })

  return {
    contactBooks,
    contacts: filteredContacts,
    allContacts: contacts,
    selectedContactBook,
    setSelectedContactBook,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchContactBooks,
    ensureDefaultContactBook,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    toggleStar,
  }
}
