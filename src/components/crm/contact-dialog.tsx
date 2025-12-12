"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CRMContact, CRMAccount, LeadSource } from "@/types/crm"

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: CRMContact | null
  accounts: CRMAccount[]
  onSave: (contact: Partial<CRMContact>) => void
}

const salutations = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."]
const leadSources: LeadSource[] = ["Web", "Phone", "Email", "Referral", "Partner", "Trade Show", "Social Media", "Cold Call", "Other"]

export function ContactDialog({ open, onOpenChange, contact, accounts, onSave }: ContactDialogProps) {
  const [formData, setFormData] = useState<Partial<CRMContact>>({
    salutation: null,
    first_name: "",
    last_name: "",
    title: null,
    department: null,
    account_id: null,
    email: "",
    secondary_email: null,
    phone: null,
    mobile: null,
    fax: null,
    lead_source: "Web",
    birthday: null,
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
    do_not_call: false,
    email_opt_out: false,
  })

  useEffect(() => {
    if (contact) {
      setFormData(contact)
    } else {
      setFormData({
        salutation: null,
        first_name: "",
        last_name: "",
        title: null,
        department: null,
        account_id: null,
        email: "",
        secondary_email: null,
        phone: null,
        mobile: null,
        fax: null,
        lead_source: "Web",
        birthday: null,
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
        do_not_call: false,
        email_opt_out: false,
      })
    }
  }, [contact, open])

  const handleSave = () => {
    onSave({ ...formData, id: contact?.id })
    onOpenChange(false)
  }

  const updateField = (field: keyof CRMContact, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-[#243178] border-[#2d3c8a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#F39C12]">
            {contact ? "Edit Contact" : "New Contact"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-4 bg-[#2d3c8a]">
              <TabsTrigger value="basic" className="data-[state=active]:bg-[#F39C12]">Basic Info</TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-[#F39C12]">Contact</TabsTrigger>
              <TabsTrigger value="address" className="data-[state=active]:bg-[#F39C12]">Address</TabsTrigger>
              <TabsTrigger value="other" className="data-[state=active]:bg-[#F39C12]">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Salutation</Label>
                  <Select
                    value={formData.salutation || ""}
                    onValueChange={(value) => updateField("salutation", value || null)}
                  >
                    <SelectTrigger className="bg-[#2d3c8a] border-[#3d4d9a]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d3c8a] border-[#3d4d9a]">
                      {salutations.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">First Name *</Label>
                  <Input
                    value={formData.first_name || ""}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Last Name *</Label>
                  <Input
                    value={formData.last_name || ""}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Title</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="CTO"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Department</Label>
                  <Input
                    value={formData.department || ""}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Account</Label>
                <Select
                  value={formData.account_id || ""}
                  onValueChange={(value) => updateField("account_id", value || null)}
                >
                  <SelectTrigger className="bg-[#2d3c8a] border-[#3d4d9a]">
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d3c8a] border-[#3d4d9a]">
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Lead Source</Label>
                  <Select
                    value={formData.lead_source || ""}
                    onValueChange={(value) => updateField("lead_source", value as LeadSource)}
                  >
                    <SelectTrigger className="bg-[#2d3c8a] border-[#3d4d9a]">
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d3c8a] border-[#3d4d9a]">
                      {leadSources.map((source) => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Birthday</Label>
                  <Input
                    type="date"
                    value={formData.birthday || ""}
                    onChange={(e) => updateField("birthday", e.target.value || null)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Secondary Email</Label>
                  <Input
                    type="email"
                    value={formData.secondary_email || ""}
                    onChange={(e) => updateField("secondary_email", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="john.personal@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Phone</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="+1 555-0123"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Mobile</Label>
                  <Input
                    value={formData.mobile || ""}
                    onChange={(e) => updateField("mobile", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="+1 555-0124"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA]">Fax</Label>
                  <Input
                    value={formData.fax || ""}
                    onChange={(e) => updateField("fax", e.target.value)}
                    className="bg-[#2d3c8a] border-[#3d4d9a]"
                    placeholder="+1 555-0125"
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="do_not_call"
                    checked={formData.do_not_call || false}
                    onCheckedChange={(checked) => updateField("do_not_call", checked)}
                    className="border-[#3d4d9a] data-[state=checked]:bg-[#F39C12]"
                  />
                  <Label htmlFor="do_not_call" className="text-[#A1A1AA]">Do Not Call</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email_opt_out"
                    checked={formData.email_opt_out || false}
                    onCheckedChange={(checked) => updateField("email_opt_out", checked)}
                    className="border-[#3d4d9a] data-[state=checked]:bg-[#F39C12]"
                  />
                  <Label htmlFor="email_opt_out" className="text-[#A1A1AA]">Email Opt Out</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Mailing Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[#A1A1AA]">Street</Label>
                    <Input
                      value={formData.mailing_street || ""}
                      onChange={(e) => updateField("mailing_street", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">City</Label>
                    <Input
                      value={formData.mailing_city || ""}
                      onChange={(e) => updateField("mailing_city", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">State</Label>
                    <Input
                      value={formData.mailing_state || ""}
                      onChange={(e) => updateField("mailing_state", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Postal Code</Label>
                    <Input
                      value={formData.mailing_code || ""}
                      onChange={(e) => updateField("mailing_code", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="94102"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Country</Label>
                    <Input
                      value={formData.mailing_country || ""}
                      onChange={(e) => updateField("mailing_country", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="USA"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Other Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[#A1A1AA]">Street</Label>
                    <Input
                      value={formData.other_street || ""}
                      onChange={(e) => updateField("other_street", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="456 Oak Ave"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">City</Label>
                    <Input
                      value={formData.other_city || ""}
                      onChange={(e) => updateField("other_city", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">State</Label>
                    <Input
                      value={formData.other_state || ""}
                      onChange={(e) => updateField("other_state", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Postal Code</Label>
                    <Input
                      value={formData.other_code || ""}
                      onChange={(e) => updateField("other_code", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="90001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Country</Label>
                    <Input
                      value={formData.other_country || ""}
                      onChange={(e) => updateField("other_country", e.target.value)}
                      className="bg-[#2d3c8a] border-[#3d4d9a]"
                      placeholder="USA"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="bg-[#2d3c8a] border-[#3d4d9a] min-h-[150px]"
                  placeholder="Additional notes about this contact..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#3d4d9a] hover:bg-[#2d3c8a]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
            disabled={!formData.first_name || !formData.last_name || !formData.email}
          >
            {contact ? "Update Contact" : "Create Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
