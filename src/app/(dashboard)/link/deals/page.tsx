"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Briefcase, Plus, ArrowLeft, TrendingUp, DollarSign, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CRMDataTable, CRMDealStageBadge, type CRMColumn } from "@/components/crm"
import { DealDialog } from "@/components/crm/deal-dialog"
import { useDeals, useAccounts, useContacts } from "@/hooks/use-crm"
import { useToast } from "@/hooks/use-toast"
import type { CRMDeal, CRMDealInsert } from "@/types/crm"
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

const columns: CRMColumn<CRMDeal>[] = [
  {
    key: "deal_no",
    label: "Deal #",
    sortable: true,
    render: (deal) => (
      <span className="font-mono text-[#FFB830]">{deal.deal_no}</span>
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
            className="h-full rounded-full bg-[#FFB830]"
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
  const { deals, loading, error, fetchDeals, createDeal, updateDeal, deleteDeal, getPipelineStats } = useDeals()
  const { accounts } = useAccounts()
  const { contacts } = useContacts()
  const { toast } = useToast()
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dealToDelete, setDealToDelete] = useState<CRMDeal | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleDeleteClick = (deal: CRMDeal) => {
    setDealToDelete(deal)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return

    try {
      await deleteDeal(dealToDelete.id)
      toast({
        title: "Deal deleted",
        description: "The deal has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the deal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDealToDelete(null)
    }
  }

  const handleSaveDeal = async (dealData: Partial<CRMDeal>) => {
    setIsSaving(true)
    try {
      if (editingDeal?.id) {
        await updateDeal(editingDeal.id, dealData as Partial<CRMDealInsert>)
        toast({
          title: "Deal updated",
          description: "The deal has been updated successfully.",
        })
      } else {
        await createDeal(dealData as Omit<CRMDealInsert, "organization_id">)
        toast({
          title: "Deal created",
          description: "The new deal has been created successfully.",
        })
      }
      setDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the deal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate stats
  const pipelineStats = getPipelineStats()
  const openDeals = deals.filter((d) => !["Closed Won", "Closed Lost"].includes(d.stage))
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFB830]/20">
              <Briefcase className="h-5 w-5 text-[#FFB830]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Deals</h1>
              <p className="text-sm text-[#A1A1AA]">Track and manage sales opportunities</p>
            </div>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDeals()}
            disabled={loading}
            className="border-[#2A2A2A]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleNewDeal}
            className="bg-[#FFB830] hover:bg-[#FFB830]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Deal
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
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm">Pipeline Value</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#FFB830]">
            {loading ? "-" : formatCurrency(pipelineStats.total_value - pipelineStats.won_value - pipelineStats.lost_value)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Won Revenue</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {loading ? "-" : formatCurrency(pipelineStats.won_value)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Open Deals</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "-" : openDeals.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4">
          <p className="text-sm text-[#A1A1AA]">Avg. Deal Size</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "-" : formatCurrency(avgDealSize)}
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
          {pipelineStats.by_stage.map((stageData) => {
            const stageColor = stageData.stage === "Closed Won" ? "#00D68F" : stageData.stage === "Closed Lost" ? "#FF4757" : "#FFB830"

            return (
              <div key={stageData.stage} className="flex-1 rounded-lg bg-[#2A2A2A] p-3">
                <p className="text-xs text-[#A1A1AA]">{stageData.stage}</p>
                <p className="text-lg font-bold" style={{ color: stageColor }}>
                  {stageData.count}
                </p>
                <p className="text-xs text-[#A1A1AA]">{formatCurrency(stageData.value)}</p>
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
          isLoading={loading}
          searchPlaceholder="Search deals..."
          onView={handleViewDeal}
          onEdit={handleEditDeal}
          onDelete={handleDeleteClick}
          selectedItems={selectedDeals}
          onSelectionChange={setSelectedDeals}
          emptyMessage="No deals found. Click 'New Deal' to create one."
          accentColor="#FFB830"
        />
      </motion.div>

      {/* Deal Dialog */}
      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editingDeal}
        accounts={accounts}
        contacts={contacts}
        onSave={handleSaveDeal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2A2A2A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Deal</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete the deal "{dealToDelete?.deal_name}"? This action cannot be undone.
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
