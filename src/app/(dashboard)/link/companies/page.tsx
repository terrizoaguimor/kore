"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Building2, Plus, ArrowLeft, Globe, Users, DollarSign, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMRatingBadge, CRMStatusBadge, type CRMColumn } from "@/components/crm"
import { AccountDialog } from "@/components/crm/account-dialog"
import { useAccounts } from "@/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CRMAccount, CRMAccountInsert } from "@/types/crm"
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
      <span className="font-mono text-[#FFB830]">{account.account_no}</span>
    ),
  },
  {
    key: "account_name",
    label: "Company Name",
    sortable: true,
    render: (account) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB830]/20">
          <Building2 className="h-4 w-4 text-[#FFB830]" />
        </div>
        <div>
          <p className="font-medium">{account.account_name}</p>
          {account.website && (
            <a
              href={account.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#A1A1AA] hover:text-[#FFB830] flex items-center gap-1"
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
  const { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount } = useAccounts()
  const { toast } = useToast()
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CRMAccount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<CRMAccount | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleDeleteClick = (account: CRMAccount) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return

    try {
      await deleteAccount(accountToDelete.id)
      toast({
        title: "Company deleted",
        description: "The company has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const handleSaveAccount = async (accountData: Partial<CRMAccount>) => {
    setIsSaving(true)
    try {
      if (editingAccount?.id) {
        await updateAccount(editingAccount.id, accountData as Partial<CRMAccountInsert>)
        toast({
          title: "Company updated",
          description: "The company has been updated successfully.",
        })
      } else {
        await createAccount(accountData as Omit<CRMAccountInsert, "organization_id">)
        toast({
          title: "Company created",
          description: "The new company has been created successfully.",
        })
      }
      setDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFB830]/20">
              <Building2 className="h-5 w-5 text-[#FFB830]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Companies</h1>
              <p className="text-sm text-[#A1A1AA]">Track organizations and accounts</p>
            </div>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAccounts()}
            disabled={loading}
            className="border-[#2A2A2A]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleNewAccount}
            className="bg-[#FFB830] hover:bg-[#FFB830]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Company
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
            <Building2 className="h-4 w-4" />
            <p className="text-sm">Total Companies</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#FFB830]">{loading ? "-" : accounts.length}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Total Revenue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">{loading ? "-" : formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Customers</p>
          <p className="mt-1 text-2xl font-bold text-white">{loading ? "-" : customerCount}</p>
          <p className="text-xs text-[#A1A1AA]">{prospectCount} prospects</p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Users className="h-4 w-4" />
            <p className="text-sm">Total Employees</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{loading ? "-" : totalEmployees.toLocaleString()}</p>
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
          isLoading={loading}
          searchPlaceholder="Search companies..."
          onView={handleViewAccount}
          onEdit={handleEditAccount}
          onDelete={handleDeleteClick}
          selectedItems={selectedAccounts}
          onSelectionChange={setSelectedAccounts}
          emptyMessage="No companies found. Click 'New Company' to create one."
          accentColor="#FFB830"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2A2A2A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Company</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete "{accountToDelete?.account_name}"? This action cannot be undone.
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
