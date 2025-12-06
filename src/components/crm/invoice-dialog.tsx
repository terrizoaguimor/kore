"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  Calendar,
  Building2,
  User,
  FileText,
  Plus,
  Trash2,
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
import type { CRMInvoice, InvoiceStatus, CRMAccount, CRMContact, CRMInvoiceLineItem } from "@/types/crm"

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice?: CRMInvoice | null
  accounts?: CRMAccount[]
  contacts?: CRMContact[]
  onSave: (invoiceData: Partial<CRMInvoice> & { line_items?: Partial<CRMInvoiceLineItem>[] }) => Promise<void>
}

const INVOICE_STATUSES: InvoiceStatus[] = ["Draft", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue", "Cancelled"]

interface LineItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  line_total: number
}

export function InvoiceDialog({ open, onOpenChange, invoice, accounts = [], contacts = [], onSave }: InvoiceDialogProps) {
  const [formData, setFormData] = useState({
    subject: "",
    account_id: "",
    contact_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "Draft" as InvoiceStatus,
    billing_street: "",
    billing_city: "",
    billing_state: "",
    billing_code: "",
    billing_country: "",
    discount_percent: 0,
    tax_percent: 0,
    shipping_amount: 0,
    adjustment: 0,
    terms_conditions: "",
    notes: "",
    currency: "USD",
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", product_name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0, line_total: 0 }
  ])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (invoice) {
      setFormData({
        subject: invoice.subject,
        account_id: invoice.account_id || "",
        contact_id: invoice.contact_id || "",
        invoice_date: invoice.invoice_date || new Date().toISOString().split("T")[0],
        due_date: invoice.due_date || "",
        status: invoice.status,
        billing_street: invoice.billing_street || "",
        billing_city: invoice.billing_city || "",
        billing_state: invoice.billing_state || "",
        billing_code: invoice.billing_code || "",
        billing_country: invoice.billing_country || "",
        discount_percent: invoice.discount_percent || 0,
        tax_percent: invoice.tax_percent || 0,
        shipping_amount: invoice.shipping_amount || 0,
        adjustment: invoice.adjustment || 0,
        terms_conditions: invoice.terms_conditions || "",
        notes: invoice.notes || "",
        currency: invoice.currency || "USD",
      })
      if (invoice.line_items && invoice.line_items.length > 0) {
        setLineItems(invoice.line_items.map(li => ({
          id: li.id,
          product_name: li.product_name,
          description: li.description || "",
          quantity: li.quantity,
          unit_price: li.unit_price,
          discount_percent: li.discount_percent,
          tax_percent: li.tax_percent,
          line_total: li.line_total,
        })))
      }
    } else {
      // Set default due date to 30 days from now
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      setFormData({
        subject: "",
        account_id: "",
        contact_id: "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        status: "Draft",
        billing_street: "",
        billing_city: "",
        billing_state: "",
        billing_code: "",
        billing_country: "",
        discount_percent: 0,
        tax_percent: 0,
        shipping_amount: 0,
        adjustment: 0,
        terms_conditions: "",
        notes: "",
        currency: "USD",
      })
      setLineItems([
        { id: "1", product_name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0, line_total: 0 }
      ])
    }
  }, [invoice, open])

  // Calculate line item total
  const calculateLineTotal = (item: LineItem): number => {
    const subtotal = item.quantity * item.unit_price
    const discountAmount = subtotal * (item.discount_percent / 100)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * (item.tax_percent / 100)
    return afterDiscount + taxAmount
  }

  // Calculate invoice totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const discountAmount = subtotal * (formData.discount_percent / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (formData.tax_percent / 100)
  const total = afterDiscount + taxAmount + formData.shipping_amount + formData.adjustment

  const handleSave = async () => {
    if (!formData.subject.trim() || !formData.due_date) return

    setIsSaving(true)
    try {
      await onSave({
        ...(invoice ? { id: invoice.id } : {}),
        subject: formData.subject,
        account_id: formData.account_id || null,
        contact_id: formData.contact_id || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        status: formData.status,
        billing_street: formData.billing_street || null,
        billing_city: formData.billing_city || null,
        billing_state: formData.billing_state || null,
        billing_code: formData.billing_code || null,
        billing_country: formData.billing_country || null,
        subtotal,
        discount_percent: formData.discount_percent,
        discount_amount: discountAmount,
        tax_percent: formData.tax_percent,
        tax_amount: taxAmount,
        shipping_amount: formData.shipping_amount,
        adjustment: formData.adjustment,
        total,
        currency: formData.currency,
        terms_conditions: formData.terms_conditions || null,
        notes: formData.notes || null,
        line_items: lineItems.filter(li => li.product_name.trim()).map((li, index) => ({
          id: li.id.startsWith('new-') ? `temp-${Date.now()}-${index}` : li.id,
          invoice_id: '',
          product_code: null,
          product_name: li.product_name,
          description: li.description || null,
          quantity: li.quantity,
          unit_price: li.unit_price,
          discount_percent: li.discount_percent,
          discount_amount: calculateLineTotal(li) * (li.discount_percent / 100),
          tax_percent: li.tax_percent,
          line_total: calculateLineTotal(li),
          position: index,
          created_at: new Date().toISOString(),
        })) as any,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        updated.line_total = calculateLineTotal(updated)
        return updated
      }
      return item
    }))
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      id: `new-${Date.now()}`,
      product_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 0,
      line_total: 0,
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{invoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <FileText className="h-4 w-4" />
              Invoice Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  placeholder="Invoice subject"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Status</Label>
                <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {INVOICE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

          <Separator className="bg-[#2A2A2A]" />

          {/* Dates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <Calendar className="h-4 w-4" />
              Dates
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => updateField("invoice_date", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  required
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

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
                <DollarSign className="h-4 w-4" />
                Line Items
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="border-[#2A2A2A] bg-transparent text-white hover:bg-[#2A2A2A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="rounded-lg border border-[#2A2A2A] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-[#2A2A2A] px-4 py-2 text-xs font-medium text-[#A1A1AA]">
                <div className="col-span-4">Product/Service</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Tax %</div>
                <div className="col-span-1">Total</div>
                <div className="col-span-1"></div>
              </div>
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-2 border-t border-[#2A2A2A] items-center">
                  <div className="col-span-4">
                    <Input
                      value={item.product_name}
                      onChange={(e) => updateLineItem(item.id, "product_name", e.target.value)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white h-8 text-sm"
                      placeholder="Product name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax_percent}
                      onChange={(e) => updateLineItem(item.id, "tax_percent", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-1 text-sm font-medium text-green-400">
                    ${calculateLineTotal(item).toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Totals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F39C12]">
              <DollarSign className="h-4 w-4" />
              Totals
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => updateField("discount_percent", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Tax %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tax_percent}
                      onChange={(e) => updateField("tax_percent", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Shipping</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_amount}
                      onChange={(e) => updateField("shipping_amount", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A1A1AA]">Adjustment</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.adjustment}
                      onChange={(e) => updateField("adjustment", parseFloat(e.target.value) || 0)}
                      className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-[#2A2A2A] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1AA]">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1AA]">Discount ({formData.discount_percent}%)</span>
                  <span className="text-red-400">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1AA]">Tax ({formData.tax_percent}%)</span>
                  <span className="text-white">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1AA]">Shipping</span>
                  <span className="text-white">${formData.shipping_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1AA]">Adjustment</span>
                  <span className="text-white">${formData.adjustment.toFixed(2)}</span>
                </div>
                <Separator className="bg-[#3A3A3A]" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#2A2A2A]" />

          {/* Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Terms & Conditions</Label>
              <Textarea
                value={formData.terms_conditions}
                onChange={(e) => updateField("terms_conditions", e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white min-h-[60px]"
                placeholder="Payment terms, conditions, etc."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white min-h-[60px]"
                placeholder="Additional notes..."
              />
            </div>
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
            disabled={isSaving || !formData.subject.trim() || !formData.due_date}
            className="bg-[#F39C12] text-white hover:bg-[#F39C12]/90"
          >
            {isSaving ? "Saving..." : "Save Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
