"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Receipt, Plus, ArrowLeft, DollarSign, Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMInvoiceStatusBadge, type CRMColumn } from "@/components/crm"
import { InvoiceDialog } from "@/components/crm/invoice-dialog"
import { useInvoices, useAccounts, useContacts } from "@/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CRMInvoice, CRMInvoiceInsert, CRMInvoiceLineItemInsert } from "@/types/crm"
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

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function InvoicesPage() {
  const { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceStats } = useInvoices()
  const { accounts } = useAccounts()
  const { contacts } = useContacts()
  const { toast } = useToast()
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<CRMInvoice | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<CRMInvoice | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
            {accounts.find(a => a.id === invoice.account_id)?.account_name || "-"}
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

  const handleDeleteClick = (invoice: CRMInvoice) => {
    setInvoiceToDelete(invoice)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return

    try {
      await deleteInvoice(invoiceToDelete.id)
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const handleSaveInvoice = async (invoiceData: Partial<CRMInvoice>, lineItems?: any[]) => {
    setIsSaving(true)
    try {
      const lineItemsFormatted: Omit<CRMInvoiceLineItemInsert, "invoice_id">[] = (lineItems || []).map((item) => ({
        product_name: item.product_name || item.productName || "Product",
        product_code: item.product_code || item.productCode || null,
        description: item.description || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price || item.unitPrice) || 0,
        discount_percent: Number(item.discount_percent || item.discountPercent) || 0,
        discount_amount: Number(item.discount_amount || item.discountAmount) || 0,
        tax_percent: Number(item.tax_percent || item.taxPercent) || 0,
      }))

      if (editingInvoice?.id) {
        await updateInvoice(editingInvoice.id, invoiceData as Partial<CRMInvoiceInsert>, lineItemsFormatted)
        toast({
          title: "Invoice updated",
          description: "The invoice has been updated successfully.",
        })
      } else {
        await createInvoice(invoiceData as Omit<CRMInvoiceInsert, "organization_id">, lineItemsFormatted)
        toast({
          title: "Invoice created",
          description: "The new invoice has been created successfully.",
        })
      }
      setDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate stats
  const stats = getInvoiceStats()
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchInvoices()}
            disabled={loading}
            className="border-[#2A2A2A]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleNewInvoice}
            className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
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
            <Clock className="h-4 w-4" />
            <p className="text-sm">Outstanding</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#F39C12]">
            {loading ? "-" : formatCurrency(stats.pending)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Overdue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {loading ? "-" : formatCurrency(stats.overdue)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">Paid</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {loading ? "-" : formatCurrency(stats.paid)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Receipt className="h-4 w-4" />
            <p className="text-sm">Draft Invoices</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "-" : draftCount}
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
          isLoading={loading}
          searchPlaceholder="Search invoices..."
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteClick}
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
        accounts={accounts}
        contacts={contacts}
        onSave={handleSaveInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2A2A2A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete invoice "{invoiceToDelete?.invoice_no}"? This action cannot be undone.
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
