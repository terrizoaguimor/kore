"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { UserCircle, Plus, ArrowLeft, Building2, Mail, Phone, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, type CRMColumn } from "@/components/crm"
import { ContactDialog } from "@/components/crm/contact-dialog"
import { useContacts, useAccounts } from "@/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CRMContact, CRMContactInsert } from "@/types/crm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CRMContactsPage() {
  const { contacts, loading, error, fetchContacts, createContact, updateContact, deleteContact } = useContacts()
  const { accounts } = useAccounts()
  const { toast } = useToast()
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<CRMContact | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const columns: CRMColumn<CRMContact>[] = [
    {
      key: "contact_no",
      label: "Contact #",
      sortable: true,
      render: (contact) => (
        <span className="font-mono text-[#FFB830]">{contact.contact_no}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFB830]/20">
            <UserCircle className="h-4 w-4 text-[#FFB830]" />
          </div>
          <div>
            <p className="font-medium">
              {contact.salutation ? `${contact.salutation} ` : ""}
              {contact.first_name} {contact.last_name}
            </p>
            {contact.title && <p className="text-sm text-[#A1A1AA]">{contact.title}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "account",
      label: "Account",
      render: (contact) => {
        const account = accounts.find((a) => a.id === contact.account_id)
        return account ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#A1A1AA]" />
            <span>{account.account_name}</span>
          </div>
        ) : (
          <span className="text-[#A1A1AA]">-</span>
        )
      },
    },
    {
      key: "email",
      label: "Email",
      render: (contact) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#A1A1AA]" />
          <span>{contact.email || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (contact) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#A1A1AA]" />
          <span>{contact.phone || contact.mobile || "-"}</span>
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (contact) => contact.department || "-",
    },
    {
      key: "lead_source",
      label: "Source",
      render: (contact) => contact.lead_source || "-",
    },
  ]

  const handleNewContact = () => {
    setEditingContact(null)
    setDialogOpen(true)
  }

  const handleViewContact = (contact: CRMContact) => {
    setEditingContact(contact)
    setDialogOpen(true)
  }

  const handleEditContact = (contact: CRMContact) => {
    setEditingContact(contact)
    setDialogOpen(true)
  }

  const handleDeleteClick = (contact: CRMContact) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return

    try {
      await deleteContact(contactToDelete.id)
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const handleSaveContact = async (contactData: Partial<CRMContact>) => {
    setIsSaving(true)
    try {
      if (editingContact?.id) {
        await updateContact(editingContact.id, contactData as Partial<CRMContactInsert>)
        toast({
          title: "Contact updated",
          description: "The contact has been updated successfully.",
        })
      } else {
        await createContact(contactData as Omit<CRMContactInsert, "organization_id">)
        toast({
          title: "Contact created",
          description: "The new contact has been created successfully.",
        })
      }
      setDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate stats
  const totalContacts = contacts.length
  const withAccounts = contacts.filter((c) => c.account_id).length
  const withEmail = contacts.filter((c) => c.email).length
  const sources = [...new Set(contacts.map((c) => c.lead_source).filter(Boolean))].length

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Back Link */}
      <Link
        href="/link"
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Link
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFB830]/20">
              <UserCircle className="h-5 w-5 text-[#FFB830]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contacts</h1>
              <p className="text-sm text-[#A1A1AA]">Manage individual contacts and relationships</p>
            </div>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchContacts()}
            disabled={loading}
            className="border-[#2A2A2A]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleNewContact}
            className="bg-[#FFB830] hover:bg-[#FFB830]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 grid grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <UserCircle className="h-4 w-4" />
            <p className="text-sm">Total Contacts</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#FFB830]">{loading ? "-" : totalContacts}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Building2 className="h-4 w-4" />
            <p className="text-sm">With Accounts</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{loading ? "-" : withAccounts}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Mail className="h-4 w-4" />
            <p className="text-sm">With Email</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{loading ? "-" : withEmail}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Lead Sources</p>
          <p className="mt-1 text-2xl font-bold text-white">{loading ? "-" : sources}</p>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CRMDataTable
          data={contacts}
          columns={columns}
          isLoading={loading}
          searchPlaceholder="Search contacts..."
          onView={handleViewContact}
          onEdit={handleEditContact}
          onDelete={handleDeleteClick}
          selectedItems={selectedContacts}
          onSelectionChange={setSelectedContacts}
          emptyMessage="No contacts found. Click 'New Contact' to create one."
          accentColor="#FFB830"
        />
      </motion.div>

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editingContact}
        accounts={accounts}
        onSave={handleSaveContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2A2A2A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Contact</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete "{contactToDelete?.first_name} {contactToDelete?.last_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2A2A2A] border-[#3A3A3A] text-white hover:bg-[#3A3A3A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
