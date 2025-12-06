"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Plus,
  Search,
  Loader2,
  UserPlus,
  Grid3X3,
  List,
  Star,
  Mail,
  Phone,
  Building2,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useContacts } from "@/hooks/use-contacts"
import { useAuthStore } from "@/stores/auth-store"
import { ContactCard } from "@/components/contacts/contact-card"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from "@/types/database"

interface ContactWithDetails extends Contact {
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
}

export default function ContactsPage() {
  const { organization } = useAuthStore()
  const {
    contacts,
    isLoading,
    searchQuery,
    setSearchQuery,
    ensureDefaultContactBook,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    toggleStar,
  } = useContacts()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactWithDetails | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContact, setDetailContact] = useState<ContactWithDetails | null>(null)

  // Initialize contact book and fetch contacts
  useEffect(() => {
    if (organization) {
      ensureDefaultContactBook()
    }
  }, [organization, ensureDefaultContactBook])

  const handleNewContact = useCallback(() => {
    setSelectedContact(null)
    setDialogOpen(true)
  }, [])

  const handleEditContact = useCallback((contact: ContactWithDetails) => {
    setSelectedContact(contact)
    setDialogOpen(true)
  }, [])

  const handleContactClick = useCallback((contact: ContactWithDetails) => {
    setDetailContact(contact)
    setDetailOpen(true)
  }, [])

  const handleSaveContact = useCallback(async (contactData: any) => {
    if (contactData.id) {
      return updateContact(contactData)
    }
    return createContact(contactData)
  }, [createContact, updateContact])

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <Badge variant="secondary">{contacts.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "grid" ? "bg-muted" : ""}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "list" ? "bg-muted" : ""}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <Button onClick={handleNewContact}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Users className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No contacts yet</h3>
            <p className="mt-2 text-muted-foreground">
              Add your first contact to get started
            </p>
            <Button className="mt-6" onClick={handleNewContact}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => handleContactClick(contact)}
                onEdit={() => handleEditContact(contact)}
                onDelete={() => deleteContact(contact.id)}
                onToggleStar={() => toggleStar(contact)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-3">Phone</div>
              <div className="col-span-2">Company</div>
            </div>
            {contacts.map((contact) => {
              const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ")
              const displayName = fullName || contact.organization || "Unnamed"
              const primaryEmail = contact.emails?.find((e) => e.is_primary) || contact.emails?.[0]
              const primaryPhone = contact.phones?.find((p) => p.is_primary) || contact.phones?.[0]

              return (
                <div
                  key={contact.id}
                  className="grid grid-cols-12 gap-4 border-b px-4 py-3 last:border-0 hover:bg-muted/50 cursor-pointer items-center"
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    {contact.is_starred && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{displayName}</span>
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground truncate">
                    {primaryEmail?.email || "-"}
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {primaryPhone?.phone || "-"}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground truncate">
                    {contact.organization || "-"}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
        onSave={handleSaveContact}
        onDelete={deleteContact}
      />

      {/* Contact Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          {detailContact && (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={detailContact.photo_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {[detailContact.first_name, detailContact.last_name]
                        .filter(Boolean)
                        .map((n) => n![0])
                        .join("")
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-left">
                        {[detailContact.first_name, detailContact.last_name].filter(Boolean).join(" ") ||
                          detailContact.organization ||
                          "Unnamed Contact"}
                      </SheetTitle>
                      {detailContact.is_starred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    {detailContact.organization && detailContact.first_name && (
                      <p className="text-sm text-muted-foreground">
                        {detailContact.job_title
                          ? `${detailContact.job_title} at ${detailContact.organization}`
                          : detailContact.organization}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailOpen(false)
                      handleEditContact(detailContact)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStar(detailContact)}
                  >
                    <Star
                      className={`mr-2 h-4 w-4 ${
                        detailContact.is_starred ? "fill-yellow-400 text-yellow-400" : ""
                      }`}
                    />
                    {detailContact.is_starred ? "Starred" : "Star"}
                  </Button>
                </div>
              </SheetHeader>

              <Separator className="my-6" />

              <div className="space-y-6">
                {/* Emails */}
                {detailContact.emails && detailContact.emails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </h4>
                    <div className="space-y-1">
                      {detailContact.emails.map((email) => (
                        <div key={email.id} className="flex items-center justify-between">
                          <a
                            href={`mailto:${email.email}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {email.email}
                          </a>
                          <Badge variant="outline" className="text-xs">
                            {email.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phones */}
                {detailContact.phones && detailContact.phones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </h4>
                    <div className="space-y-1">
                      {detailContact.phones.map((phone) => (
                        <div key={phone.id} className="flex items-center justify-between">
                          <a
                            href={`tel:${phone.phone}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {phone.phone}
                          </a>
                          <Badge variant="outline" className="text-xs">
                            {phone.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addresses */}
                {detailContact.addresses && detailContact.addresses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <div className="space-y-3">
                      {detailContact.addresses.map((address) => (
                        <div key={address.id} className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {address.type}
                          </Badge>
                          <p className="text-sm">
                            {[
                              address.street,
                              [address.city, address.state, address.postal_code]
                                .filter(Boolean)
                                .join(", "),
                              address.country,
                            ]
                              .filter(Boolean)
                              .join("\n")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organization */}
                {detailContact.organization && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization
                    </h4>
                    <p className="text-sm">{detailContact.organization}</p>
                    {detailContact.job_title && (
                      <p className="text-sm text-muted-foreground">{detailContact.job_title}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {detailContact.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {detailContact.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
