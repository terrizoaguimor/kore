"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { HandshakeIcon, Plus, ArrowLeft, RefreshCw, UserCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMLeadStatusBadge, CRMRatingBadge, type CRMColumn } from "@/components/crm"
import { LeadDialog } from "@/components/crm/lead-dialog"
import { useLeads } from "@/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CRMLead, CRMLeadInsert } from "@/types/crm"
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

const columns: CRMColumn<CRMLead>[] = [
  {
    key: "lead_no",
    label: "Lead #",
    sortable: true,
    render: (lead) => (
      <span className="font-mono text-[#0046E2]">{lead.lead_no}</span>
    ),
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (lead) => (
      <div>
        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
        {lead.title && <p className="text-sm text-[#A1A1AA]">{lead.title}</p>}
      </div>
    ),
  },
  {
    key: "company",
    label: "Company",
    sortable: true,
    render: (lead) => (
      <div>
        <p>{lead.company}</p>
        {lead.industry && <p className="text-sm text-[#A1A1AA]">{lead.industry}</p>}
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (lead) => lead.email || "-",
  },
  {
    key: "phone",
    label: "Phone",
    render: (lead) => lead.phone || lead.mobile || "-",
  },
  {
    key: "lead_status",
    label: "Status",
    sortable: true,
    render: (lead) => <CRMLeadStatusBadge status={lead.lead_status} />,
  },
  {
    key: "rating",
    label: "Rating",
    render: (lead) => <CRMRatingBadge rating={lead.rating} />,
  },
  {
    key: "lead_source",
    label: "Source",
    render: (lead) => lead.lead_source || "-",
  },
]

export default function LeadsPage() {
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead, convertLead } = useLeads()
  const { toast } = useToast()
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<CRMLead | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [leadToConvert, setLeadToConvert] = useState<CRMLead | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleNewLead = () => {
    setEditingLead(null)
    setDialogOpen(true)
  }

  const handleViewLead = (lead: CRMLead) => {
    setEditingLead(lead)
    setDialogOpen(true)
  }

  const handleEditLead = (lead: CRMLead) => {
    setEditingLead(lead)
    setDialogOpen(true)
  }

  const handleDeleteClick = (lead: CRMLead) => {
    setLeadToDelete(lead)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return

    try {
      await deleteLead(leadToDelete.id)
      toast({
        title: "Lead deleted",
        description: "The lead has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  const handleConvertClick = (lead: CRMLead) => {
    setLeadToConvert(lead)
    setConvertDialogOpen(true)
  }

  const handleConfirmConvert = async () => {
    if (!leadToConvert) return

    try {
      setIsSaving(true)
      const result = await convertLead(leadToConvert.id, true, true)
      toast({
        title: "Lead converted",
        description: `Created Account, Contact, and Deal from lead "${leadToConvert.company}".`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to convert the lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setConvertDialogOpen(false)
      setLeadToConvert(null)
    }
  }

  const handleSaveLead = async (leadData: Partial<CRMLead>) => {
    setIsSaving(true)
    try {
      if (editingLead?.id) {
        await updateLead(editingLead.id, leadData as Partial<CRMLeadInsert>)
        toast({
          title: "Lead updated",
          description: "The lead has been updated successfully.",
        })
      } else {
        await createLead(leadData as Omit<CRMLeadInsert, "organization_id">)
        toast({
          title: "Lead created",
          description: "The new lead has been created successfully.",
        })
      }
      setDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Custom actions for leads (convert)
  const customActions = (lead: CRMLead) => {
    if (lead.lead_status === "Qualified" && !lead.converted) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
          onClick={(e) => {
            e.stopPropagation()
            handleConvertClick(lead)
          }}
        >
          <UserCheck className="h-4 w-4 mr-1" />
          Convert
        </Button>
      )
    }
    return null
  }

  return (
    <div className="min-h-full bg-[#0f1a4a] p-6">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/20">
              <HandshakeIcon className="h-5 w-5 text-[#0046E2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leads</h1>
              <p className="text-sm text-[#A1A1AA]">Capture and nurture potential customers</p>
            </div>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLeads()}
            disabled={loading}
            className="border-[#2d3c8a]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleNewLead}
            className="bg-[#0046E2] hover:bg-[#0046E2]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Lead
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
        {[
          { label: "Total Leads", value: leads.length, color: "#0046E2" },
          { label: "New", value: leads.filter((l) => l.lead_status === "New").length, color: "#0046E2" },
          { label: "Qualified", value: leads.filter((l) => l.lead_status === "Qualified").length, color: "#00D68F" },
          { label: "Hot Leads", value: leads.filter((l) => l.rating === "Hot").length, color: "#FF4757" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#243178] bg-[#243178] p-4"
          >
            <p className="text-sm text-[#A1A1AA]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
              {loading ? "-" : stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CRMDataTable
          data={leads}
          columns={columns}
          isLoading={loading}
          searchPlaceholder="Search leads..."
          onView={handleViewLead}
          onEdit={handleEditLead}
          onDelete={handleDeleteClick}
          selectedItems={selectedLeads}
          onSelectionChange={setSelectedLeads}
          emptyMessage="No leads found. Click 'New Lead' to create one."
          accentColor="#0046E2"
          customActions={customActions}
        />
      </motion.div>

      {/* Lead Dialog */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={handleSaveLead}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#243178] border-[#2d3c8a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete the lead "{leadToDelete?.first_name} {leadToDelete?.last_name}" from {leadToDelete?.company}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2d3c8a] border-[#3A3A3A] text-white hover:bg-[#3A3A3A]">
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

      {/* Convert Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent className="bg-[#243178] border-[#2d3c8a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Convert Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Convert "{leadToConvert?.first_name} {leadToConvert?.last_name}" from {leadToConvert?.company} into:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>A new <strong className="text-white">Account</strong> ({leadToConvert?.company})</li>
                <li>A new <strong className="text-white">Contact</strong> ({leadToConvert?.first_name} {leadToConvert?.last_name})</li>
                <li>A new <strong className="text-white">Deal</strong> (Opportunity)</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2d3c8a] border-[#3A3A3A] text-white hover:bg-[#3A3A3A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConvert}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? "Converting..." : "Convert Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
