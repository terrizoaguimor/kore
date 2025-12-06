"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  Calendar,
  Building2,
  User,
  Target,
  FileText,
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
import type { CRMDeal, DealStage, LeadSource, CRMAccount, CRMContact } from "@/types/crm"

interface DealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal?: CRMDeal | null
  accounts?: CRMAccount[]
  contacts?: CRMContact[]
  onSave: (dealData: Partial<CRMDeal>) => Promise<void>
}

const DEAL_STAGES: DealStage[] = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
const LEAD_SOURCES: LeadSource[] = ["Web", "Phone", "Email", "Referral", "Partner", "Trade Show", "Social Media", "Cold Call", "Other"]

const STAGE_PROBABILITIES: Record<DealStage, number> = {
  "Prospecting": 10,
  "Qualification": 25,
  "Proposal": 50,
  "Negotiation": 75,
  "Closed Won": 100,
  "Closed Lost": 0,
}

export function DealDialog({ open, onOpenChange, deal, accounts = [], contacts = [], onSave }: DealDialogProps) {
  const [formData, setFormData] = useState({
    deal_name: "",
    account_id: "",
    contact_id: "",
    amount: 0,
    currency: "USD",
    stage: "Prospecting" as DealStage,
    probability: 10,
    expected_close_date: "",
    lead_source: "" as LeadSource | "",
    deal_type: "",
    next_step: "",
    description: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name,
        account_id: deal.account_id || "",
        contact_id: deal.contact_id || "",
        amount: deal.amount,
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date || "",
        lead_source: deal.lead_source || "",
        deal_type: deal.deal_type || "",
        next_step: deal.next_step || "",
        description: deal.description || "",
      })
    } else {
      setFormData({
        deal_name: "",
        account_id: "",
        contact_id: "",
        amount: 0,
        currency: "USD",
        stage: "Prospecting",
        probability: 10,
        expected_close_date: "",
        lead_source: "",
        deal_type: "",
        next_step: "",
        description: "",
      })
    }
  }, [deal, open])

  const handleSave = async () => {
    if (!formData.deal_name.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        ...(deal ? { id: deal.id } : {}),
        deal_name: formData.deal_name,
        account_id: formData.account_id || null,
        contact_id: formData.contact_id || null,
        amount: formData.amount,
        currency: formData.currency,
        stage: formData.stage,
        probability: formData.probability,
        expected_close_date: formData.expected_close_date || null,
        lead_source: formData.lead_source || null,
        deal_type: formData.deal_type || null,
        next_step: formData.next_step || null,
        description: formData.description || null,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      // Auto-update probability when stage changes
      if (field === "stage") {
        newData.probability = STAGE_PROBABILITIES[value as DealStage]
      }
      return newData
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{deal ? "Edit Deal" : "New Deal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Target className="h-4 w-4" />
              Deal Information
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Deal Name *</Label>
                <Input
                  value={formData.deal_name}
                  onChange={(e) => updateField("deal_name", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="Enter deal name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Account</Label>
                  <Select value={formData.account_id} onValueChange={(v) => updateField("account_id", v)}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Contact</Label>
                  <Select value={formData.contact_id} onValueChange={(v) => updateField("contact_id", v)}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Financial Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <DollarSign className="h-4 w-4" />
              Financial Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Amount</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Pipeline Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Calendar className="h-4 w-4" />
              Pipeline Status
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Stage</Label>
                <Select value={formData.stage} onValueChange={(v) => updateField("stage", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {DEAL_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => updateField("probability", parseInt(e.target.value) || 0)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Expected Close Date</Label>
                <Input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => updateField("expected_close_date", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Source & Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <FileText className="h-4 w-4" />
              Additional Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Lead Source</Label>
                <Select value={formData.lead_source} onValueChange={(v) => updateField("lead_source", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Deal Type</Label>
                <Input
                  value={formData.deal_type}
                  onChange={(e) => updateField("deal_type", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="e.g., New Business, Renewal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Next Step</Label>
              <Input
                value={formData.next_step}
                onChange={(e) => updateField("next_step", e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                placeholder="What's the next action?"
              />
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[#A1A1AA]">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="bg-[#2A2A2A] border-[#3A3A3A] text-white min-h-[100px]"
              placeholder="Add notes about this deal..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A2A2A] bg-transparent text-white hover:bg-[#2A2A2A]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.deal_name.trim()}
            className="bg-[#F39C12] text-white hover:bg-[#F39C12]/90"
          >
            {isSaving ? "Saving..." : "Save Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
