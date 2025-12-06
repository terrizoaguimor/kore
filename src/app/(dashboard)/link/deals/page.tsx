"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Briefcase, Plus, ArrowLeft, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMDealStageBadge, type CRMColumn } from "@/components/crm"
import { DealDialog } from "@/components/crm/deal-dialog"
import type { CRMDeal, CRMAccount, CRMContact } from "@/types/crm"

// Mock data - replace with actual Supabase data
const mockDeals: CRMDeal[] = [
  {
    id: "1",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-1",
    contact_id: "con-1",
    deal_no: "DEA-001000",
    deal_name: "Enterprise Software License",
    amount: 75000,
    currency: "USD",
    stage: "Proposal",
    probability: 50,
    expected_close_date: "2024-03-15",
    actual_close_date: null,
    lead_source: "Web",
    campaign_id: null,
    deal_type: "New Business",
    next_step: "Schedule demo with stakeholders",
    description: "Full enterprise license for 500 users",
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    deleted_at: null,
  },
  {
    id: "2",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-2",
    contact_id: "con-2",
    deal_no: "DEA-001001",
    deal_name: "Annual Support Contract",
    amount: 24000,
    currency: "USD",
    stage: "Negotiation",
    probability: 75,
    expected_close_date: "2024-02-28",
    actual_close_date: null,
    lead_source: "Referral",
    campaign_id: null,
    deal_type: "Renewal",
    next_step: "Send revised pricing",
    description: "Annual support and maintenance renewal",
    created_at: "2024-01-05T09:00:00Z",
    updated_at: "2024-01-14T11:00:00Z",
    deleted_at: null,
  },
  {
    id: "3",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-3",
    contact_id: null,
    deal_no: "DEA-001002",
    deal_name: "Consulting Services",
    amount: 45000,
    currency: "USD",
    stage: "Qualification",
    probability: 25,
    expected_close_date: "2024-04-30",
    actual_close_date: null,
    lead_source: "Trade Show",
    campaign_id: null,
    deal_type: "New Business",
    next_step: "Needs assessment call",
    description: "Implementation and training services",
    created_at: "2024-01-12T16:00:00Z",
    updated_at: "2024-01-12T16:00:00Z",
    deleted_at: null,
  },
  {
    id: "4",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-1",
    contact_id: "con-1",
    deal_no: "DEA-001003",
    deal_name: "Cloud Migration Project",
    amount: 150000,
    currency: "USD",
    stage: "Closed Won",
    probability: 100,
    expected_close_date: "2024-01-20",
    actual_close_date: "2024-01-18",
    lead_source: "Partner",
    campaign_id: null,
    deal_type: "New Business",
    next_step: null,
    description: "Complete cloud infrastructure migration",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-01-18T15:00:00Z",
    deleted_at: null,
  },
]

const mockAccounts: CRMAccount[] = [
  {
    id: "acc-1",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001000",
    account_name: "Tech Innovations Inc",
    parent_id: null,
    account_type: "Customer",
    industry: "Technology",
    annual_revenue: 5000000,
    rating: "Hot",
    ownership: "Private",
    employees: 150,
    phone: "+1 555-0123",
    other_phone: null,
    email: "info@techinnovations.com",
    secondary_email: null,
    website: "https://techinnovations.com",
    fax: null,
    billing_street: "123 Innovation Blvd",
    billing_city: "San Francisco",
    billing_state: "CA",
    billing_code: "94102",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    description: null,
    sic_code: null,
    ticker_symbol: null,
    email_opt_out: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  },
]

const mockContacts: CRMContact[] = [
  {
    id: "con-1",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-1",
    contact_no: "CON-001000",
    salutation: "Mr.",
    first_name: "John",
    last_name: "Smith",
    title: "CTO",
    department: "Technology",
    email: "john.smith@techinnovations.com",
    secondary_email: null,
    phone: "+1 555-0123",
    mobile: "+1 555-0124",
    fax: null,
    mailing_street: null,
    mailing_city: null,
    mailing_state: null,
    mailing_code: null,
    mailing_country: null,
    other_street: null,
    other_city: null,
    other_state: null,
    other_code: null,
    other_country: null,
    description: null,
    lead_source: "Web",
    reports_to: null,
    birthday: null,
    do_not_call: false,
    email_opt_out: false,
    photo_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  },
]

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const columns: CRMColumn<CRMDeal>[] = [
  {
    key: "deal_no",
    label: "Deal #",
    sortable: true,
    render: (deal) => (
      <span className="font-mono text-[#F39C12]">{deal.deal_no}</span>
    ),
  },
  {
    key: "deal_name",
    label: "Deal Name",
    sortable: true,
    render: (deal) => (
      <div>
        <p className="font-medium">{deal.deal_name}</p>
        {deal.deal_type && <p className="text-sm text-[#A1A1AA]">{deal.deal_type}</p>}
      </div>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    render: (deal) => (
      <span className="font-medium text-green-400">{formatCurrency(deal.amount, deal.currency)}</span>
    ),
  },
  {
    key: "stage",
    label: "Stage",
    sortable: true,
    render: (deal) => <CRMDealStageBadge stage={deal.stage} />,
  },
  {
    key: "probability",
    label: "Probability",
    sortable: true,
    render: (deal) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-[#2A2A2A]">
          <div
            className="h-full rounded-full bg-[#F39C12]"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
        <span className="text-sm">{deal.probability}%</span>
      </div>
    ),
  },
  {
    key: "expected_close_date",
    label: "Expected Close",
    sortable: true,
    render: (deal) =>
      deal.expected_close_date
        ? new Date(deal.expected_close_date).toLocaleDateString()
        : "-",
  },
  {
    key: "next_step",
    label: "Next Step",
    render: (deal) => (
      <span className="text-sm text-[#A1A1AA]">{deal.next_step || "-"}</span>
    ),
  },
]

export default function DealsPage() {
  const [deals, setDeals] = useState<CRMDeal[]>(mockDeals)
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNewDeal = () => {
    setEditingDeal(null)
    setDialogOpen(true)
  }

  const handleViewDeal = (deal: CRMDeal) => {
    setEditingDeal(deal)
    setDialogOpen(true)
  }

  const handleEditDeal = (deal: CRMDeal) => {
    setEditingDeal(deal)
    setDialogOpen(true)
  }

  const handleDeleteDeal = async (deal: CRMDeal) => {
    // TODO: Implement delete with Supabase
    setDeals(deals.filter((d) => d.id !== deal.id))
  }

  const handleSaveDeal = async (dealData: Partial<CRMDeal>) => {
    // TODO: Implement save with Supabase
    if (dealData.id) {
      // Update existing deal
      setDeals(deals.map((d) => (d.id === dealData.id ? { ...d, ...dealData } : d)))
    } else {
      // Create new deal
      const newDeal: CRMDeal = {
        ...dealData as CRMDeal,
        id: `deal-${Date.now()}`,
        organization_id: "org-1",
        owner_id: "user-1",
        deal_no: `DEA-${String(1004 + deals.length).padStart(6, "0")}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      setDeals([newDeal, ...deals])
    }
  }

  // Calculate stats
  const totalPipelineValue = deals
    .filter((d) => !["Closed Won", "Closed Lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.amount, 0)
  const wonValue = deals
    .filter((d) => d.stage === "Closed Won")
    .reduce((sum, d) => sum + d.amount, 0)
  const avgDealSize = deals.length > 0 ? deals.reduce((sum, d) => sum + d.amount, 0) / deals.length : 0

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
              <Briefcase className="h-5 w-5 text-[#F39C12]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Deals</h1>
              <p className="text-sm text-[#A1A1AA]">Track and manage sales opportunities</p>
            </div>
          </div>
        </motion.div>
        <Button
          onClick={handleNewDeal}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 grid grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm">Pipeline Value</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#F39C12]">
            {formatCurrency(totalPipelineValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Won Revenue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {formatCurrency(wonValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Open Deals</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {deals.filter((d) => !["Closed Won", "Closed Lost"].includes(d.stage)).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Avg. Deal Size</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatCurrency(avgDealSize)}
          </p>
        </div>
      </motion.div>

      {/* Pipeline Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6 rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
      >
        <h3 className="mb-4 text-sm font-medium text-[#A1A1AA]">Pipeline Stages</h3>
        <div className="flex gap-2">
          {["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"].map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage)
            const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0)
            const stageColor = stage === "Closed Won" ? "#10B981" : stage === "Closed Lost" ? "#EF4444" : "#F39C12"

            return (
              <div key={stage} className="flex-1 rounded-lg bg-[#2A2A2A] p-3">
                <p className="text-xs text-[#A1A1AA]">{stage}</p>
                <p className="text-lg font-bold" style={{ color: stageColor }}>
                  {stageDeals.length}
                </p>
                <p className="text-xs text-[#A1A1AA]">{formatCurrency(stageValue)}</p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CRMDataTable
          data={deals}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search deals..."
          onView={handleViewDeal}
          onEdit={handleEditDeal}
          onDelete={handleDeleteDeal}
          selectedItems={selectedDeals}
          onSelectionChange={setSelectedDeals}
          emptyMessage="No deals found. Click 'New Deal' to create one."
          accentColor="#F39C12"
        />
      </motion.div>

      {/* Deal Dialog */}
      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editingDeal}
        accounts={mockAccounts}
        contacts={mockContacts}
        onSave={handleSaveDeal}
      />
    </div>
  )
}
