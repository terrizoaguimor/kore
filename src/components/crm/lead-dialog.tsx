"use client"

import { useState, useEffect } from "react"
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Users,
  DollarSign,
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
import type { CRMLead, LeadSource, LeadStatus, Rating } from "@/types/crm"

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: CRMLead | null
  onSave: (leadData: Partial<CRMLead>) => Promise<void>
}

const LEAD_SOURCES: LeadSource[] = ["Web", "Phone", "Email", "Referral", "Partner", "Trade Show", "Social Media", "Cold Call", "Other"]
const LEAD_STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"]
const RATINGS: Rating[] = ["Hot", "Warm", "Cold"]

export function LeadDialog({ open, onOpenChange, lead, onSave }: LeadDialogProps) {
  const [formData, setFormData] = useState({
    salutation: "",
    first_name: "",
    last_name: "",
    company: "",
    title: "",
    email: "",
    secondary_email: "",
    phone: "",
    mobile: "",
    website: "",
    lead_source: "" as LeadSource | "",
    lead_status: "New" as LeadStatus,
    rating: "" as Rating | "",
    industry: "",
    annual_revenue: 0,
    employees: 0,
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    description: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      setFormData({
        salutation: lead.salutation || "",
        first_name: lead.first_name || "",
        last_name: lead.last_name,
        company: lead.company,
        title: lead.title || "",
        email: lead.email || "",
        secondary_email: lead.secondary_email || "",
        phone: lead.phone || "",
        mobile: lead.mobile || "",
        website: lead.website || "",
        lead_source: lead.lead_source || "",
        lead_status: lead.lead_status,
        rating: lead.rating || "",
        industry: lead.industry || "",
        annual_revenue: lead.annual_revenue,
        employees: lead.employees || 0,
        street: lead.street || "",
        city: lead.city || "",
        state: lead.state || "",
        postal_code: lead.postal_code || "",
        country: lead.country || "",
        description: lead.description || "",
      })
    } else {
      setFormData({
        salutation: "",
        first_name: "",
        last_name: "",
        company: "",
        title: "",
        email: "",
        secondary_email: "",
        phone: "",
        mobile: "",
        website: "",
        lead_source: "",
        lead_status: "New",
        rating: "",
        industry: "",
        annual_revenue: 0,
        employees: 0,
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        description: "",
      })
    }
  }, [lead, open])

  const handleSave = async () => {
    if (!formData.last_name.trim() || !formData.company.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        ...(lead ? { id: lead.id } : {}),
        salutation: formData.salutation || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name,
        company: formData.company,
        title: formData.title || null,
        email: formData.email || null,
        secondary_email: formData.secondary_email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        website: formData.website || null,
        lead_source: formData.lead_source || null,
        lead_status: formData.lead_status,
        rating: formData.rating || null,
        industry: formData.industry || null,
        annual_revenue: formData.annual_revenue,
        employees: formData.employees || null,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        description: formData.description || null,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <User className="h-4 w-4" />
              Personal Information
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Salutation</Label>
                <Select value={formData.salutation} onValueChange={(v) => updateField("salutation", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[#A1A1AA]">Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  required
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Building2 className="h-4 w-4" />
              Company Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Company *</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Industry</Label>
                <Input
                  value={formData.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
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
                <Label className="text-[#A1A1AA]">Annual Revenue</Label>
                <Input
                  type="number"
                  value={formData.annual_revenue}
                  onChange={(e) => updateField("annual_revenue", parseFloat(e.target.value) || 0)}
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
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Mail className="h-4 w-4" />
              Contact Information
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label className="text-[#A1A1AA]">Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Mobile</Label>
                <Input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Lead Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Briefcase className="h-4 w-4" />
              Lead Status
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <Label className="text-[#A1A1AA]">Lead Status</Label>
                <Select value={formData.lead_status} onValueChange={(v) => updateField("lead_status", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
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
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <MapPin className="h-4 w-4" />
              Address
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Street"
                value={formData.street}
                onChange={(e) => updateField("street", e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Postal Code"
                  value={formData.postal_code}
                  onChange={(e) => updateField("postal_code", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
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
              placeholder="Add notes about this lead..."
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
            disabled={isSaving || !formData.last_name.trim() || !formData.company.trim()}
            className="bg-[#F39C12] text-white hover:bg-[#F39C12]/90"
          >
            {isSaving ? "Saving..." : "Save Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
