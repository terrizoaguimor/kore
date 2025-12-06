"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Users,
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
import { Switch } from "@/components/ui/switch"
import type { CRMAccount, AccountType, Rating } from "@/types/crm"

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: CRMAccount | null
  accounts?: CRMAccount[] // For parent account selection
  onSave: (accountData: Partial<CRMAccount>) => Promise<void>
}

const ACCOUNT_TYPES: AccountType[] = ["Customer", "Prospect", "Partner", "Vendor", "Competitor", "Other"]
const RATINGS: Rating[] = ["Hot", "Warm", "Cold"]
const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail",
  "Education", "Real Estate", "Construction", "Transportation", "Energy",
  "Media", "Telecommunications", "Agriculture", "Other"
]

export function AccountDialog({ open, onOpenChange, account, accounts = [], onSave }: AccountDialogProps) {
  const [formData, setFormData] = useState({
    account_name: "",
    parent_id: "",
    account_type: "" as AccountType | "",
    industry: "",
    annual_revenue: 0,
    rating: "" as Rating | "",
    ownership: "",
    employees: 0,
    phone: "",
    other_phone: "",
    email: "",
    secondary_email: "",
    website: "",
    fax: "",
    billing_street: "",
    billing_city: "",
    billing_state: "",
    billing_code: "",
    billing_country: "",
    shipping_street: "",
    shipping_city: "",
    shipping_state: "",
    shipping_code: "",
    shipping_country: "",
    description: "",
    sic_code: "",
    ticker_symbol: "",
    email_opt_out: false,
  })
  const [copyBillingToShipping, setCopyBillingToShipping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name,
        parent_id: account.parent_id || "",
        account_type: account.account_type || "",
        industry: account.industry || "",
        annual_revenue: account.annual_revenue,
        rating: account.rating || "",
        ownership: account.ownership || "",
        employees: account.employees,
        phone: account.phone || "",
        other_phone: account.other_phone || "",
        email: account.email || "",
        secondary_email: account.secondary_email || "",
        website: account.website || "",
        fax: account.fax || "",
        billing_street: account.billing_street || "",
        billing_city: account.billing_city || "",
        billing_state: account.billing_state || "",
        billing_code: account.billing_code || "",
        billing_country: account.billing_country || "",
        shipping_street: account.shipping_street || "",
        shipping_city: account.shipping_city || "",
        shipping_state: account.shipping_state || "",
        shipping_code: account.shipping_code || "",
        shipping_country: account.shipping_country || "",
        description: account.description || "",
        sic_code: account.sic_code || "",
        ticker_symbol: account.ticker_symbol || "",
        email_opt_out: account.email_opt_out,
      })
    } else {
      setFormData({
        account_name: "",
        parent_id: "",
        account_type: "",
        industry: "",
        annual_revenue: 0,
        rating: "",
        ownership: "",
        employees: 0,
        phone: "",
        other_phone: "",
        email: "",
        secondary_email: "",
        website: "",
        fax: "",
        billing_street: "",
        billing_city: "",
        billing_state: "",
        billing_code: "",
        billing_country: "",
        shipping_street: "",
        shipping_city: "",
        shipping_state: "",
        shipping_code: "",
        shipping_country: "",
        description: "",
        sic_code: "",
        ticker_symbol: "",
        email_opt_out: false,
      })
    }
  }, [account, open])

  const handleSave = async () => {
    if (!formData.account_name.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        ...(account ? { id: account.id } : {}),
        account_name: formData.account_name,
        parent_id: formData.parent_id || null,
        account_type: formData.account_type || null,
        industry: formData.industry || null,
        annual_revenue: formData.annual_revenue,
        rating: formData.rating || null,
        ownership: formData.ownership || null,
        employees: formData.employees,
        phone: formData.phone || null,
        other_phone: formData.other_phone || null,
        email: formData.email || null,
        secondary_email: formData.secondary_email || null,
        website: formData.website || null,
        fax: formData.fax || null,
        billing_street: formData.billing_street || null,
        billing_city: formData.billing_city || null,
        billing_state: formData.billing_state || null,
        billing_code: formData.billing_code || null,
        billing_country: formData.billing_country || null,
        shipping_street: copyBillingToShipping ? formData.billing_street : formData.shipping_street || null,
        shipping_city: copyBillingToShipping ? formData.billing_city : formData.shipping_city || null,
        shipping_state: copyBillingToShipping ? formData.billing_state : formData.shipping_state || null,
        shipping_code: copyBillingToShipping ? formData.billing_code : formData.shipping_code || null,
        shipping_country: copyBillingToShipping ? formData.billing_country : formData.shipping_country || null,
        description: formData.description || null,
        sic_code: formData.sic_code || null,
        ticker_symbol: formData.ticker_symbol || null,
        email_opt_out: formData.email_opt_out,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const filteredAccounts = accounts.filter(a => a.id !== account?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{account ? "Edit Company" : "New Company"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Building2 className="h-4 w-4" />
              Company Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Company Name *</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => updateField("account_name", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Parent Company</Label>
                <Select value={formData.parent_id} onValueChange={(v) => updateField("parent_id", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select parent company" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {filteredAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Account Type</Label>
                <Select value={formData.account_type} onValueChange={(v) => updateField("account_type", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Industry</Label>
                <Select value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Rating</Label>
                <Select value={formData.rating} onValueChange={(v) => updateField("rating", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {RATINGS.map((rating) => (
                      <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Ownership</Label>
                <Input
                  value={formData.ownership}
                  onChange={(e) => updateField("ownership", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="e.g., Public, Private, Subsidiary"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Financial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <DollarSign className="h-4 w-4" />
              Financial Information
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Annual Revenue</Label>
                <Input
                  type="number"
                  value={formData.annual_revenue}
                  onChange={(e) => updateField("annual_revenue", parseFloat(e.target.value) || 0)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Employees</Label>
                <Input
                  type="number"
                  value={formData.employees}
                  onChange={(e) => updateField("employees", parseInt(e.target.value) || 0)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Ticker Symbol</Label>
                <Input
                  value={formData.ticker_symbol}
                  onChange={(e) => updateField("ticker_symbol", e.target.value.toUpperCase())}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="e.g., AAPL"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Phone className="h-4 w-4" />
              Contact Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Other Phone</Label>
                <Input
                  type="tel"
                  value={formData.other_phone}
                  onChange={(e) => updateField("other_phone", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Secondary Email</Label>
                <Input
                  type="email"
                  value={formData.secondary_email}
                  onChange={(e) => updateField("secondary_email", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Fax</Label>
                <Input
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => updateField("fax", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.email_opt_out}
                onCheckedChange={(v) => updateField("email_opt_out", v)}
              />
              <Label className="text-[#A1A1AA]">Email Opt Out</Label>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Billing Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <MapPin className="h-4 w-4" />
              Billing Address
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Street"
                value={formData.billing_street}
                onChange={(e) => updateField("billing_street", e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.billing_city}
                  onChange={(e) => updateField("billing_city", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <Input
                  placeholder="State"
                  value={formData.billing_state}
                  onChange={(e) => updateField("billing_state", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Postal Code"
                  value={formData.billing_code}
                  onChange={(e) => updateField("billing_code", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <Input
                  placeholder="Country"
                  value={formData.billing_country}
                  onChange={(e) => updateField("billing_country", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Shipping Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={copyBillingToShipping}
                  onCheckedChange={setCopyBillingToShipping}
                />
                <Label className="text-[#A1A1AA] text-sm">Same as billing</Label>
              </div>
            </div>
            {!copyBillingToShipping && (
              <div className="space-y-4">
                <Input
                  placeholder="Street"
                  value={formData.shipping_street}
                  onChange={(e) => updateField("shipping_street", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={formData.shipping_city}
                    onChange={(e) => updateField("shipping_city", e.target.value)}
                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  />
                  <Input
                    placeholder="State"
                    value={formData.shipping_state}
                    onChange={(e) => updateField("shipping_state", e.target.value)}
                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Postal Code"
                    value={formData.shipping_code}
                    onChange={(e) => updateField("shipping_code", e.target.value)}
                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  />
                  <Input
                    placeholder="Country"
                    value={formData.shipping_country}
                    onChange={(e) => updateField("shipping_country", e.target.value)}
                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[#A1A1AA]">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="bg-[#2A2A2A] border-[#3A3A3A] text-white min-h-[100px]"
              placeholder="Add notes about this company..."
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
            disabled={isSaving || !formData.account_name.trim()}
            className="bg-[#F39C12] text-white hover:bg-[#F39C12]/90"
          >
            {isSaving ? "Saving..." : "Save Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
