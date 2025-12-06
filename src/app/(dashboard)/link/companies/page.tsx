"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Building2, Plus, ArrowLeft, Globe, Users, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMRatingBadge, CRMStatusBadge, type CRMColumn } from "@/components/crm"
import { AccountDialog } from "@/components/crm/account-dialog"
import type { CRMAccount } from "@/types/crm"

// Mock data - replace with actual Supabase data
const mockAccounts: CRMAccount[] = [
  {
    id: "1",
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
    description: "Leading technology solutions provider",
    sic_code: "7371",
    ticker_symbol: null,
    email_opt_out: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    deleted_at: null,
  },
  {
    id: "2",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001001",
    account_name: "Global Marketing Co",
    parent_id: null,
    account_type: "Prospect",
    industry: "Marketing",
    annual_revenue: 2500000,
    rating: "Warm",
    ownership: "Private",
    employees: 75,
    phone: "+1 555-0125",
    other_phone: null,
    email: "contact@globalmarketing.com",
    secondary_email: null,
    website: "https://globalmarketing.com",
    fax: null,
    billing_street: "456 Marketing Ave",
    billing_city: "New York",
    billing_state: "NY",
    billing_code: "10001",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    description: "Full-service marketing agency",
    sic_code: "7311",
    ticker_symbol: null,
    email_opt_out: false,
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
    deleted_at: null,
  },
  {
    id: "3",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001002",
    account_name: "FinServ Solutions",
    parent_id: null,
    account_type: "Customer",
    industry: "Finance",
    annual_revenue: 15000000,
    rating: "Hot",
    ownership: "Public",
    employees: 500,
    phone: "+1 555-0126",
    other_phone: "+1 555-0127",
    email: "info@finserv.com",
    secondary_email: "support@finserv.com",
    website: "https://finservsolutions.com",
    fax: null,
    billing_street: "789 Finance Blvd",
    billing_city: "Chicago",
    billing_state: "IL",
    billing_code: "60601",
    billing_country: "USA",
    shipping_street: "789 Finance Blvd",
    shipping_city: "Chicago",
    shipping_state: "IL",
    shipping_code: "60601",
    shipping_country: "USA",
    description: "Enterprise financial software solutions",
    sic_code: "6211",
    ticker_symbol: "FNSV",
    email_opt_out: false,
    created_at: "2024-01-08T00:00:00Z",
    updated_at: "2024-01-12T00:00:00Z",
    deleted_at: null,
  },
  {
    id: "4",
    organization_id: "org-1",
    owner_id: "user-1",
    account_no: "ACC-001003",
    account_name: "Healthcare Plus",
    parent_id: null,
    account_type: "Partner",
    industry: "Healthcare",
    annual_revenue: 8000000,
    rating: "Warm",
    ownership: "Private",
    employees: 200,
    phone: "+1 555-0128",
    other_phone: null,
    email: "partnerships@healthcareplus.com",
    secondary_email: null,
    website: "https://healthcareplus.com",
    fax: null,
    billing_street: "321 Health Way",
    billing_city: "Boston",
    billing_state: "MA",
    billing_code: "02101",
    billing_country: "USA",
    shipping_street: null,
    shipping_city: null,
    shipping_state: null,
    shipping_code: null,
    shipping_country: null,
    description: "Healthcare technology partner",
    sic_code: "8011",
    ticker_symbol: null,
    email_opt_out: false,
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-14T00:00:00Z",
    deleted_at: null,
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getAccountTypeVariant = (type: string | null): "default" | "success" | "warning" | "info" => {
  switch (type) {
    case "Customer": return "success"
    case "Prospect": return "info"
    case "Partner": return "warning"
    default: return "default"
  }
}

const columns: CRMColumn<CRMAccount>[] = [
  {
    key: "account_no",
    label: "Account #",
    sortable: true,
    render: (account) => (
      <span className="font-mono text-[#F39C12]">{account.account_no}</span>
    ),
  },
  {
    key: "account_name",
    label: "Company Name",
    sortable: true,
    render: (account) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F39C12]/20">
          <Building2 className="h-4 w-4 text-[#F39C12]" />
        </div>
        <div>
          <p className="font-medium">{account.account_name}</p>
          {account.website && (
            <a
              href={account.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#A1A1AA] hover:text-[#F39C12] flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-3 w-3" />
              {account.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "account_type",
    label: "Type",
    sortable: true,
    render: (account) => (
      <CRMStatusBadge
        status={account.account_type || "Other"}
        variant={getAccountTypeVariant(account.account_type)}
      />
    ),
  },
  {
    key: "industry",
    label: "Industry",
    sortable: true,
    render: (account) => account.industry || "-",
  },
  {
    key: "phone",
    label: "Phone",
    render: (account) => account.phone || "-",
  },
  {
    key: "rating",
    label: "Rating",
    render: (account) => <CRMRatingBadge rating={account.rating} />,
  },
  {
    key: "annual_revenue",
    label: "Revenue",
    sortable: true,
    render: (account) => (
      <span className="text-green-400">{formatCurrency(account.annual_revenue)}</span>
    ),
  },
  {
    key: "employees",
    label: "Employees",
    sortable: true,
    render: (account) => (
      <div className="flex items-center gap-1 text-[#A1A1AA]">
        <Users className="h-3 w-3" />
        {account.employees.toLocaleString()}
      </div>
    ),
  },
]

export default function CompaniesPage() {
  const [accounts, setAccounts] = useState<CRMAccount[]>(mockAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CRMAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNewAccount = () => {
    setEditingAccount(null)
    setDialogOpen(true)
  }

  const handleViewAccount = (account: CRMAccount) => {
    setEditingAccount(account)
    setDialogOpen(true)
  }

  const handleEditAccount = (account: CRMAccount) => {
    setEditingAccount(account)
    setDialogOpen(true)
  }

  const handleDeleteAccount = async (account: CRMAccount) => {
    // TODO: Implement delete with Supabase
    setAccounts(accounts.filter((a) => a.id !== account.id))
  }

  const handleSaveAccount = async (accountData: Partial<CRMAccount>) => {
    // TODO: Implement save with Supabase
    if (accountData.id) {
      // Update existing account
      setAccounts(accounts.map((a) => (a.id === accountData.id ? { ...a, ...accountData } : a)))
    } else {
      // Create new account
      const newAccount: CRMAccount = {
        ...accountData as CRMAccount,
        id: `acc-${Date.now()}`,
        organization_id: "org-1",
        owner_id: "user-1",
        account_no: `ACC-${String(1004 + accounts.length).padStart(6, "0")}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      setAccounts([newAccount, ...accounts])
    }
  }

  // Calculate stats
  const totalRevenue = accounts.reduce((sum, a) => sum + a.annual_revenue, 0)
  const totalEmployees = accounts.reduce((sum, a) => sum + a.employees, 0)
  const customerCount = accounts.filter((a) => a.account_type === "Customer").length
  const prospectCount = accounts.filter((a) => a.account_type === "Prospect").length

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
              <Building2 className="h-5 w-5 text-[#F39C12]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Companies</h1>
              <p className="text-sm text-[#A1A1AA]">Track organizations and accounts</p>
            </div>
          </div>
        </motion.div>
        <Button
          onClick={handleNewAccount}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Company
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
            <Building2 className="h-4 w-4" />
            <p className="text-sm">Total Companies</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#F39C12]">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Total Revenue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Customers</p>
          <p className="mt-1 text-2xl font-bold text-white">{customerCount}</p>
          <p className="text-xs text-[#A1A1AA]">{prospectCount} prospects</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Users className="h-4 w-4" />
            <p className="text-sm">Total Employees</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{totalEmployees.toLocaleString()}</p>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CRMDataTable
          data={accounts}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search companies..."
          onView={handleViewAccount}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
          selectedItems={selectedAccounts}
          onSelectionChange={setSelectedAccounts}
          emptyMessage="No companies found. Click 'New Company' to create one."
          accentColor="#F39C12"
        />
      </motion.div>

      {/* Account Dialog */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
        accounts={accounts}
        onSave={handleSaveAccount}
      />
    </div>
  )
}
