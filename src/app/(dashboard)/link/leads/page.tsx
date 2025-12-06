"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { HandshakeIcon, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMLeadStatusBadge, CRMRatingBadge, type CRMColumn } from "@/components/crm"
import { LeadDialog } from "@/components/crm/lead-dialog"
import type { CRMLead } from "@/types/crm"

// Mock data - replace with actual Supabase data
const mockLeads: CRMLead[] = [
  {
    id: "1",
    organization_id: "org-1",
    owner_id: "user-1",
    lead_no: "LEA-001000",
    salutation: "Mr.",
    first_name: "John",
    last_name: "Smith",
    company: "Tech Innovations Inc",
    email: "john.smith@techinnovations.com",
    secondary_email: null,
    phone: "+1 555-0123",
    mobile: "+1 555-0124",
    fax: null,
    website: "https://techinnovations.com",
    street: "123 Innovation Blvd",
    city: "San Francisco",
    state: "CA",
    postal_code: "94102",
    country: "USA",
    lead_source: "Web",
    lead_status: "Qualified",
    rating: "Hot",
    industry: "Technology",
    annual_revenue: 5000000,
    employees: 150,
    title: "CTO",
    description: "Interested in enterprise solutions",
    email_opt_out: false,
    converted: false,
    converted_contact_id: null,
    converted_account_id: null,
    converted_deal_id: null,
    converted_at: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    deleted_at: null,
  },
  {
    id: "2",
    organization_id: "org-1",
    owner_id: "user-1",
    lead_no: "LEA-001001",
    salutation: "Ms.",
    first_name: "Sarah",
    last_name: "Johnson",
    company: "Global Marketing Co",
    email: "sarah.j@globalmarketing.com",
    secondary_email: null,
    phone: "+1 555-0125",
    mobile: null,
    fax: null,
    website: null,
    street: null,
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "USA",
    lead_source: "Referral",
    lead_status: "Contacted",
    rating: "Warm",
    industry: "Marketing",
    annual_revenue: 2000000,
    employees: 50,
    title: "Marketing Director",
    description: null,
    email_opt_out: false,
    converted: false,
    converted_contact_id: null,
    converted_account_id: null,
    converted_deal_id: null,
    converted_at: null,
    created_at: "2024-01-16T14:30:00Z",
    updated_at: "2024-01-16T14:30:00Z",
    deleted_at: null,
  },
  {
    id: "3",
    organization_id: "org-1",
    owner_id: "user-1",
    lead_no: "LEA-001002",
    salutation: null,
    first_name: "Michael",
    last_name: "Chen",
    company: "FinServ Solutions",
    email: "mchen@finserv.com",
    secondary_email: null,
    phone: "+1 555-0126",
    mobile: "+1 555-0127",
    fax: null,
    website: "https://finservsolutions.com",
    street: "456 Finance Ave",
    city: "Chicago",
    state: "IL",
    postal_code: "60601",
    country: "USA",
    lead_source: "Trade Show",
    lead_status: "New",
    rating: "Cold",
    industry: "Finance",
    annual_revenue: 10000000,
    employees: 300,
    title: "VP of Operations",
    description: "Met at FinTech Conference 2024",
    email_opt_out: false,
    converted: false,
    converted_contact_id: null,
    converted_account_id: null,
    converted_deal_id: null,
    converted_at: null,
    created_at: "2024-01-17T09:15:00Z",
    updated_at: "2024-01-17T09:15:00Z",
    deleted_at: null,
  },
]

const columns: CRMColumn<CRMLead>[] = [
  {
    key: "lead_no",
    label: "Lead #",
    sortable: true,
    render: (lead) => (
      <span className="font-mono text-[#F39C12]">{lead.lead_no}</span>
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
  const [leads, setLeads] = useState<CRMLead[]>(mockLeads)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleDeleteLead = async (lead: CRMLead) => {
    // TODO: Implement delete with Supabase
    setLeads(leads.filter((l) => l.id !== lead.id))
  }

  const handleSaveLead = async (leadData: Partial<CRMLead>) => {
    // TODO: Implement save with Supabase
    if (leadData.id) {
      // Update existing lead
      setLeads(leads.map((l) => (l.id === leadData.id ? { ...l, ...leadData } : l)))
    } else {
      // Create new lead
      const newLead: CRMLead = {
        ...leadData as CRMLead,
        id: `lead-${Date.now()}`,
        organization_id: "org-1",
        owner_id: "user-1",
        lead_no: `LEA-${String(1003 + leads.length).padStart(6, "0")}`,
        converted: false,
        converted_contact_id: null,
        converted_account_id: null,
        converted_deal_id: null,
        converted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      setLeads([newLead, ...leads])
    }
  }

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F39C12]/20">
              <HandshakeIcon className="h-5 w-5 text-[#F39C12]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leads</h1>
              <p className="text-sm text-[#A1A1AA]">Capture and nurture potential customers</p>
            </div>
          </div>
        </motion.div>
        <Button
          onClick={handleNewLead}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 grid grid-cols-4 gap-4"
      >
        {[
          { label: "Total Leads", value: leads.length, color: "#F39C12" },
          { label: "New", value: leads.filter((l) => l.lead_status === "New").length, color: "#3B82F6" },
          { label: "Qualified", value: leads.filter((l) => l.lead_status === "Qualified").length, color: "#10B981" },
          { label: "Hot Leads", value: leads.filter((l) => l.rating === "Hot").length, color: "#EF4444" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
          >
            <p className="text-sm text-[#A1A1AA]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
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
          isLoading={isLoading}
          searchPlaceholder="Search leads..."
          onView={handleViewLead}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
          selectedItems={selectedLeads}
          onSelectionChange={setSelectedLeads}
          emptyMessage="No leads found. Click 'New Lead' to create one."
          accentColor="#F39C12"
        />
      </motion.div>

      {/* Lead Dialog */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={handleSaveLead}
      />
    </div>
  )
}
