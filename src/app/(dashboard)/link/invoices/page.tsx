"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Receipt, Plus, ArrowLeft, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMInvoiceStatusBadge, type CRMColumn } from "@/components/crm"
import { InvoiceDialog } from "@/components/crm/invoice-dialog"
import type { CRMInvoice, CRMAccount, CRMContact } from "@/types/crm"

// Mock data - replace with actual Supabase data
const mockInvoices: CRMInvoice[] = [
  {
    id: "1",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-1",
    contact_id: "con-1",
    deal_id: null,
    invoice_no: "INV-001000",
    subject: "Enterprise Software License - Q1 2024",
    invoice_date: "2024-01-15",
    due_date: "2024-02-14",
    status: "Paid",
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
    subtotal: 75000,
    discount_percent: 10,
    discount_amount: 7500,
    tax_percent: 8,
    tax_amount: 5400,
    shipping_amount: 0,
    adjustment: 0,
    total: 72900,
    currency: "USD",
    terms_conditions: "Net 30",
    notes: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-02-10T14:30:00Z",
    deleted_at: null,
  },
  {
    id: "2",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-2",
    contact_id: "con-2",
    deal_id: null,
    invoice_no: "INV-001001",
    subject: "Consulting Services - January 2024",
    invoice_date: "2024-01-20",
    due_date: "2024-02-19",
    status: "Sent",
    billing_street: "456 Tech Park",
    billing_city: "Austin",
    billing_state: "TX",
    billing_code: "78701",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    subtotal: 15000,
    discount_percent: 0,
    discount_amount: 0,
    tax_percent: 8.25,
    tax_amount: 1237.5,
    shipping_amount: 0,
    adjustment: 0,
    total: 16237.5,
    currency: "USD",
    terms_conditions: "Net 30",
    notes: "Monthly retainer services",
    created_at: "2024-01-20T09:00:00Z",
    updated_at: "2024-01-20T09:00:00Z",
    deleted_at: null,
  },
  {
    id: "3",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-1",
    contact_id: "con-1",
    deal_id: null,
    invoice_no: "INV-001002",
    subject: "Support Contract Renewal",
    invoice_date: "2024-01-05",
    due_date: "2024-01-20",
    status: "Overdue",
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
    subtotal: 24000,
    discount_percent: 5,
    discount_amount: 1200,
    tax_percent: 8,
    tax_amount: 1824,
    shipping_amount: 0,
    adjustment: 0,
    total: 24624,
    currency: "USD",
    terms_conditions: "Net 15",
    notes: null,
    created_at: "2024-01-05T11:00:00Z",
    updated_at: "2024-01-05T11:00:00Z",
    deleted_at: null,
  },
  {
    id: "4",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-3",
    contact_id: null,
    deal_id: null,
    invoice_no: "INV-001003",
    subject: "Training Workshop - Team of 20",
    invoice_date: "2024-01-25",
    due_date: "2024-02-24",
    status: "Draft",
    billing_street: "789 Corporate Way",
    billing_city: "New York",
    billing_state: "NY",
    billing_code: "10001",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    subtotal: 8000,
    discount_percent: 0,
    discount_amount: 0,
    tax_percent: 8.875,
    tax_amount: 710,
    shipping_amount: 0,
    adjustment: 0,
    total: 8710,
    currency: "USD",
    terms_conditions: "Net 30",
    notes: "On-site training workshop",
    created_at: "2024-01-25T16:00:00Z",
    updated_at: "2024-01-25T16:00:00Z",
    deleted_at: null,
  },
  {
    id: "5",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-2",
    contact_id: "con-2",
    deal_id: null,
    invoice_no: "INV-001004",
    subject: "Implementation Services Phase 2",
    invoice_date: "2024-01-28",
    due_date: "2024-02-27",
    status: "Partially Paid",
    billing_street: "456 Tech Park",
    billing_city: "Austin",
    billing_state: "TX",
    billing_code: "78701",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    subtotal: 45000,
    discount_percent: 0,
    discount_amount: 0,
    tax_percent: 8.25,
    tax_amount: 3712.5,
    shipping_amount: 500,
    adjustment: -100,
    total: 49112.5,
    currency: "USD",
    terms_conditions: "Net 30, 50% upfront",
    notes: "50% paid upfront",
    created_at: "2024-01-28T10:00:00Z",
    updated_at: "2024-01-29T09:00:00Z",
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
  {
    id: "acc-2",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001001",
    account_name: "Digital Solutions LLC",
    parent_id: null,
    account_type: "Customer",
    industry: "Software",
    annual_revenue: 2500000,
    rating: "Warm",
    ownership: "LLC",
    employees: 75,
    phone: "+1 555-0456",
    other_phone: null,
    email: "info@digitalsolutions.com",
    secondary_email: null,
    website: "https://digitalsolutions.com",
    fax: null,
    billing_street: "456 Tech Park",
    billing_city: "Austin",
    billing_state: "TX",
    billing_code: "78701",
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
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    deleted_at: null,
  },
  {
    id: "acc-3",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001002",
    account_name: "Enterprise Corp",
    parent_id: null,
    account_type: "Prospect",
    industry: "Finance",
    annual_revenue: 10000000,
    rating: "Hot",
    ownership: "Public",
    employees: 500,
    phone: "+1 555-0789",
    other_phone: null,
    email: "info@enterprisecorp.com",
    secondary_email: null,
    website: "https://enterprisecorp.com",
    fax: null,
    billing_street: "789 Corporate Way",
    billing_city: "New York",
    billing_state: "NY",
    billing_code: "10001",
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
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
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
  {
    id: "con-2",
    organization_id: "org-1",
    owner_id: "user-1",
    account_id: "acc-2",
    contact_no: "CON-001001",
    salutation: "Ms.",
    first_name: "Sarah",
    last_name: "Johnson",
    title: "VP of Engineering",
    department: "Engineering",
    email: "sarah.johnson@digitalsolutions.com",
    secondary_email: null,
    phone: "+1 555-0456",
    mobile: "+1 555-0457",
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
    lead_source: "Referral",
    reports_to: null,
    birthday: null,
    do_not_call: false,
    email_opt_out: false,
    photo_url: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
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

const columns: CRMColumn<CRMInvoice>[] = [
  {
    key: "invoice_no",
    label: "Invoice #",
    sortable: true,
    render: (invoice) => (
      <span className="font-mono text-[#F39C12]">{invoice.invoice_no}</span>
    ),
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    render: (invoice) => (
      <div>
        <p className="font-medium">{invoice.subject}</p>
        <p className="text-sm text-[#A1A1AA]">
          {mockAccounts.find(a => a.id === invoice.account_id)?.account_name || "-"}
        </p>
      </div>
    ),
  },
  {
    key: "invoice_date",
    label: "Date",
    sortable: true,
    render: (invoice) => new Date(invoice.invoice_date).toLocaleDateString(),
  },
  {
    key: "due_date",
    label: "Due Date",
    sortable: true,
    render: (invoice) => {
      const dueDate = new Date(invoice.due_date)
      const isOverdue = dueDate < new Date() && invoice.status !== "Paid"
      return (
        <span className={isOverdue ? "text-red-400" : ""}>
          {dueDate.toLocaleDateString()}
        </span>
      )
    },
  },
  {
    key: "total",
    label: "Amount",
    sortable: true,
    render: (invoice) => (
      <span className="font-medium text-green-400">{formatCurrency(invoice.total, invoice.currency)}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (invoice) => <CRMInvoiceStatusBadge status={invoice.status} />,
  },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<CRMInvoice[]>(mockInvoices)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<CRMInvoice | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNewInvoice = () => {
    setEditingInvoice(null)
    setDialogOpen(true)
  }

  const handleViewInvoice = (invoice: CRMInvoice) => {
    setEditingInvoice(invoice)
    setDialogOpen(true)
  }

  const handleEditInvoice = (invoice: CRMInvoice) => {
    setEditingInvoice(invoice)
    setDialogOpen(true)
  }

  const handleDeleteInvoice = async (invoice: CRMInvoice) => {
    // TODO: Implement delete with Supabase
    setInvoices(invoices.filter((i) => i.id !== invoice.id))
  }

  const handleSaveInvoice = async (invoiceData: Partial<CRMInvoice>) => {
    // TODO: Implement save with Supabase
    if (invoiceData.id) {
      // Update existing invoice
      setInvoices(invoices.map((i) => (i.id === invoiceData.id ? { ...i, ...invoiceData } : i)))
    } else {
      // Create new invoice
      const newInvoice: CRMInvoice = {
        ...invoiceData as CRMInvoice,
        id: `inv-${Date.now()}`,
        organization_id: "org-1",
        owner_id: "user-1",
        invoice_no: `INV-${String(1005 + invoices.length).padStart(6, "0")}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      setInvoices([newInvoice, ...invoices])
    }
  }

  // Calculate stats
  const totalOutstanding = invoices
    .filter((i) => !["Paid", "Cancelled"].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0)
  const overdueAmount = invoices
    .filter((i) => i.status === "Overdue")
    .reduce((sum, i) => sum + i.total, 0)
  const paidThisMonth = invoices
    .filter((i) => {
      if (i.status !== "Paid") return false
      const paidDate = new Date(i.updated_at)
      const now = new Date()
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, i) => sum + i.total, 0)
  const draftCount = invoices.filter((i) => i.status === "Draft").length

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
              <Receipt className="h-5 w-5 text-[#F39C12]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Invoices</h1>
              <p className="text-sm text-[#A1A1AA]">Create and track invoices</p>
            </div>
          </div>
        </motion.div>
        <Button
          onClick={handleNewInvoice}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
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
            <Clock className="h-4 w-4" />
            <p className="text-sm">Outstanding</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#F39C12]">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Overdue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {formatCurrency(overdueAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">Paid This Month</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {formatCurrency(paidThisMonth)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Receipt className="h-4 w-4" />
            <p className="text-sm">Draft Invoices</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            {draftCount}
          </p>
        </div>
      </motion.div>

      {/* Status Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6 rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4"
      >
        <h3 className="mb-4 text-sm font-medium text-[#A1A1AA]">Invoice Status</h3>
        <div className="flex gap-2">
          {["Draft", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue"].map((status) => {
            const statusInvoices = invoices.filter((i) => i.status === status)
            const statusValue = statusInvoices.reduce((sum, i) => sum + i.total, 0)
            const statusColor =
              status === "Paid" ? "#10B981" :
              status === "Overdue" ? "#EF4444" :
              status === "Partially Paid" ? "#F59E0B" :
              status === "Sent" || status === "Viewed" ? "#3B82F6" :
              "#6B7280"

            return (
              <div key={status} className="flex-1 rounded-lg bg-[#2A2A2A] p-3">
                <p className="text-xs text-[#A1A1AA]">{status}</p>
                <p className="text-lg font-bold" style={{ color: statusColor }}>
                  {statusInvoices.length}
                </p>
                <p className="text-xs text-[#A1A1AA]">{formatCurrency(statusValue)}</p>
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
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search invoices..."
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          selectedItems={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
          emptyMessage="No invoices found. Click 'New Invoice' to create one."
          accentColor="#F39C12"
        />
      </motion.div>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editingInvoice}
        accounts={mockAccounts}
        contacts={mockContacts}
        onSave={handleSaveInvoice}
      />
    </div>
  )
}
