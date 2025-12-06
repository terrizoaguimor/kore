"use client"

import { useState, useEffect } from "react"
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from "@/types/database"

interface ContactWithDetails extends Contact {
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
}

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: ContactWithDetails | null
  onSave: (contactData: any) => Promise<any>
  onDelete?: (contactId: string) => Promise<void>
}

interface EmailEntry {
  email: string
  type: string
  is_primary: boolean
}

interface PhoneEntry {
  phone: string
  type: string
  is_primary: boolean
}

interface AddressEntry {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  type: string
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
  onDelete,
}: ContactDialogProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organization, setOrganization] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [birthday, setBirthday] = useState("")
  const [notes, setNotes] = useState("")
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [phones, setPhones] = useState<PhoneEntry[]>([])
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name || "")
      setLastName(contact.last_name || "")
      setOrganization(contact.organization || "")
      setJobTitle(contact.job_title || "")
      setBirthday(contact.birthday || "")
      setNotes(contact.notes || "")
      setEmails(
        contact.emails?.map((e) => ({
          email: e.email,
          type: e.type,
          is_primary: e.is_primary,
        })) || []
      )
      setPhones(
        contact.phones?.map((p) => ({
          phone: p.phone,
          type: p.type,
          is_primary: p.is_primary,
        })) || []
      )
      setAddresses(
        contact.addresses?.map((a) => ({
          street: a.street || "",
          city: a.city || "",
          state: a.state || "",
          postal_code: a.postal_code || "",
          country: a.country || "",
          type: a.type,
        })) || []
      )
    } else {
      setFirstName("")
      setLastName("")
      setOrganization("")
      setJobTitle("")
      setBirthday("")
      setNotes("")
      setEmails([])
      setPhones([])
      setAddresses([])
    }
  }, [contact, open])

  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim() && !organization.trim()) return

    setIsSaving(true)
    try {
      const contactData = {
        ...(contact ? { id: contact.id } : {}),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        organization: organization.trim() || null,
        job_title: jobTitle.trim() || null,
        birthday: birthday || null,
        notes: notes.trim() || null,
        emails: emails.filter((e) => e.email.trim()),
        phones: phones.filter((p) => p.phone.trim()),
        addresses: addresses.filter(
          (a) => a.street.trim() || a.city.trim() || a.country.trim()
        ),
      }

      await onSave(contactData)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contact || !onDelete) return
    await onDelete(contact.id)
    onOpenChange(false)
  }

  const addEmail = () => {
    setEmails([...emails, { email: "", type: "personal", is_primary: emails.length === 0 }])
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const addPhone = () => {
    setPhones([...phones, { phone: "", type: "mobile", is_primary: phones.length === 0 }])
  }

  const removePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index))
  }

  const addAddress = () => {
    setAddresses([
      ...addresses,
      { street: "", city: "", state: "", postal_code: "", country: "", type: "home" },
    ])
  }

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Name
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Organization
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Company</Label>
                <Input
                  id="organization"
                  placeholder="Company name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Job title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addEmail}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  type="email"
                  value={email.email}
                  onChange={(e) => {
                    const newEmails = [...emails]
                    newEmails[index].email = e.target.value
                    setEmails(newEmails)
                  }}
                  className="flex-1"
                />
                <Select
                  value={email.type}
                  onValueChange={(value) => {
                    const newEmails = [...emails]
                    newEmails[index].type = value
                    setEmails(newEmails)
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmail(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Phone Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                Phone
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addPhone}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {phones.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="+1 234 567 8900"
                  type="tel"
                  value={phone.phone}
                  onChange={(e) => {
                    const newPhones = [...phones]
                    newPhones[index].phone = e.target.value
                    setPhones(newPhones)
                  }}
                  className="flex-1"
                />
                <Select
                  value={phone.type}
                  onValueChange={(value) => {
                    const newPhones = [...phones]
                    newPhones[index].type = value
                    setPhones(newPhones)
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhone(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Address Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Address
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addAddress}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {addresses.map((address, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between">
                  <Select
                    value={address.type}
                    onValueChange={(value) => {
                      const newAddresses = [...addresses]
                      newAddresses[index].type = value
                      setAddresses(newAddresses)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAddress(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Street address"
                  value={address.street}
                  onChange={(e) => {
                    const newAddresses = [...addresses]
                    newAddresses[index].street = e.target.value
                    setAddresses(newAddresses)
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => {
                      const newAddresses = [...addresses]
                      newAddresses[index].city = e.target.value
                      setAddresses(newAddresses)
                    }}
                  />
                  <Input
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => {
                      const newAddresses = [...addresses]
                      newAddresses[index].state = e.target.value
                      setAddresses(newAddresses)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Postal code"
                    value={address.postal_code}
                    onChange={(e) => {
                      const newAddresses = [...addresses]
                      newAddresses[index].postal_code = e.target.value
                      setAddresses(newAddresses)
                    }}
                  />
                  <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => {
                      const newAddresses = [...addresses]
                      newAddresses[index].country = e.target.value
                      setAddresses(newAddresses)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Birthday */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Birthday
            </div>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {contact && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (!firstName.trim() && !lastName.trim() && !organization.trim())}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
