"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  CRMLead,
  CRMLeadInsert,
  CRMContact,
  CRMContactInsert,
  CRMAccount,
  CRMAccountInsert,
  CRMDeal,
  CRMDealInsert,
  CRMInvoice,
  CRMInvoiceInsert,
  CRMInvoiceLineItem,
  CRMInvoiceLineItemInsert,
  CRMProduct,
  CRMDashboardStats,
  PipelineStats,
} from "@/types/crm"

// Helper to get untyped supabase client for CRM tables
// (CRM tables not yet in generated types)
const getCRMClient = () => createClient() as any

// ============================================
// LEADS HOOK
// ============================================
export function useLeads() {
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchLeads = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setLeads(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const createLead = async (lead: Omit<CRMLeadInsert, "organization_id">) => {
    if (!organization?.id) throw new Error("No organization selected")

    const { data, error } = await supabase
      .from("crm_leads")
      .insert({
        ...lead,
        organization_id: organization.id,
      })
      .select()
      .single()

    if (error) throw error
    setLeads((prev) => [data, ...prev])
    return data
  }

  const updateLead = async (id: string, updates: Partial<CRMLeadInsert>) => {
    const { data, error } = await supabase
      .from("crm_leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setLeads((prev) => prev.map((l) => (l.id === id ? data : l)))
    return data
  }

  const deleteLead = async (id: string) => {
    const { error } = await supabase
      .from("crm_leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const convertLead = async (
    leadId: string,
    createAccount: boolean = true,
    createDeal: boolean = true
  ) => {
    if (!organization?.id) throw new Error("No organization selected")

    const lead = leads.find((l) => l.id === leadId)
    if (!lead) throw new Error("Lead not found")

    let accountId: string | null = null
    let contactId: string | null = null
    let dealId: string | null = null

    // Create Account if requested
    if (createAccount) {
      const { data: account, error: accountError } = await supabase
        .from("crm_accounts")
        .insert({
          organization_id: organization.id,
          account_name: lead.company,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          industry: lead.industry,
          annual_revenue: lead.annual_revenue,
          employees: lead.employees || 0,
          billing_street: lead.street,
          billing_city: lead.city,
          billing_state: lead.state,
          billing_code: lead.postal_code,
          billing_country: lead.country,
        })
        .select()
        .single()

      if (accountError) throw accountError
      accountId = account.id
    }

    // Create Contact
    const { data: contact, error: contactError } = await supabase
      .from("crm_contacts")
      .insert({
        organization_id: organization.id,
        account_id: accountId,
        salutation: lead.salutation,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        title: lead.title,
        lead_source: lead.lead_source,
        mailing_street: lead.street,
        mailing_city: lead.city,
        mailing_state: lead.state,
        mailing_code: lead.postal_code,
        mailing_country: lead.country,
      })
      .select()
      .single()

    if (contactError) throw contactError
    contactId = contact.id

    // Create Deal if requested
    if (createDeal) {
      const { data: deal, error: dealError } = await supabase
        .from("crm_deals")
        .insert({
          organization_id: organization.id,
          account_id: accountId,
          contact_id: contactId,
          deal_name: `${lead.company} - Opportunity`,
          amount: lead.annual_revenue || 0,
          lead_source: lead.lead_source,
          stage: "Prospecting",
        })
        .select()
        .single()

      if (dealError) throw dealError
      dealId = deal.id
    }

    // Update Lead as converted
    const { error: updateError } = await supabase
      .from("crm_leads")
      .update({
        converted: true,
        converted_contact_id: contactId,
        converted_account_id: accountId,
        converted_deal_id: dealId,
        converted_at: new Date().toISOString(),
        lead_status: "Converted",
      })
      .eq("id", leadId)

    if (updateError) throw updateError

    setLeads((prev) => prev.filter((l) => l.id !== leadId))

    return { accountId, contactId, dealId }
  }

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertLead,
  }
}

// ============================================
// CONTACTS HOOK
// ============================================
export function useContacts() {
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchContacts = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_contacts")
      .select(`
        *,
        account:crm_accounts(id, account_name)
      `)
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setContacts(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = async (contact: Omit<CRMContactInsert, "organization_id">) => {
    if (!organization?.id) throw new Error("No organization selected")

    const { data, error } = await supabase
      .from("crm_contacts")
      .insert({
        ...contact,
        organization_id: organization.id,
      })
      .select()
      .single()

    if (error) throw error
    setContacts((prev) => [data, ...prev])
    return data
  }

  const updateContact = async (id: string, updates: Partial<CRMContactInsert>) => {
    const { data, error } = await supabase
      .from("crm_contacts")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setContacts((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from("crm_contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  }
}

// ============================================
// ACCOUNTS HOOK
// ============================================
export function useAccounts() {
  const [accounts, setAccounts] = useState<CRMAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchAccounts = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_accounts")
      .select("*")
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAccounts(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = async (account: Omit<CRMAccountInsert, "organization_id">) => {
    if (!organization?.id) throw new Error("No organization selected")

    const { data, error } = await supabase
      .from("crm_accounts")
      .insert({
        ...account,
        organization_id: organization.id,
      })
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => [data, ...prev])
    return data
  }

  const updateAccount = async (id: string, updates: Partial<CRMAccountInsert>) => {
    const { data, error } = await supabase
      .from("crm_accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)))
    return data
  }

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("crm_accounts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  }
}

// ============================================
// DEALS HOOK
// ============================================
export function useDeals() {
  const [deals, setDeals] = useState<CRMDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchDeals = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_deals")
      .select(`
        *,
        account:crm_accounts(id, account_name),
        contact:crm_contacts(id, first_name, last_name)
      `)
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setDeals(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const createDeal = async (deal: Omit<CRMDealInsert, "organization_id">) => {
    if (!organization?.id) throw new Error("No organization selected")

    const { data, error } = await supabase
      .from("crm_deals")
      .insert({
        ...deal,
        organization_id: organization.id,
      })
      .select()
      .single()

    if (error) throw error
    setDeals((prev) => [data, ...prev])
    return data
  }

  const updateDeal = async (id: string, updates: Partial<CRMDealInsert>) => {
    const { data, error } = await supabase
      .from("crm_deals")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setDeals((prev) => prev.map((d) => (d.id === id ? data : d)))
    return data
  }

  const deleteDeal = async (id: string) => {
    const { error } = await supabase
      .from("crm_deals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  const getPipelineStats = useCallback((): PipelineStats => {
    const stats: PipelineStats = {
      total_deals: deals.length,
      total_value: deals.reduce((sum, d) => sum + (d.amount || 0), 0),
      by_stage: [],
      won_value: 0,
      lost_value: 0,
      win_rate: 0,
    }

    const stages = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
    const stageMap = new Map<string, { count: number; value: number }>()

    stages.forEach((stage) => stageMap.set(stage, { count: 0, value: 0 }))

    deals.forEach((deal) => {
      const stageData = stageMap.get(deal.stage) || { count: 0, value: 0 }
      stageData.count++
      stageData.value += deal.amount || 0
      stageMap.set(deal.stage, stageData)

      if (deal.stage === "Closed Won") stats.won_value += deal.amount || 0
      if (deal.stage === "Closed Lost") stats.lost_value += deal.amount || 0
    })

    stats.by_stage = stages.map((stage) => ({
      stage: stage as any,
      count: stageMap.get(stage)?.count || 0,
      value: stageMap.get(stage)?.value || 0,
    }))

    const closedDeals = deals.filter((d) => d.stage === "Closed Won" || d.stage === "Closed Lost")
    if (closedDeals.length > 0) {
      stats.win_rate = (deals.filter((d) => d.stage === "Closed Won").length / closedDeals.length) * 100
    }

    return stats
  }, [deals])

  return {
    deals,
    loading,
    error,
    fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
    getPipelineStats,
  }
}

// ============================================
// INVOICES HOOK
// ============================================
export function useInvoices() {
  const [invoices, setInvoices] = useState<CRMInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchInvoices = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_invoices")
      .select(`
        *,
        account:crm_accounts(id, account_name),
        contact:crm_contacts(id, first_name, last_name),
        line_items:crm_invoice_line_items(*)
      `)
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setInvoices(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const createInvoice = async (
    invoice: Omit<CRMInvoiceInsert, "organization_id">,
    lineItems: Omit<CRMInvoiceLineItemInsert, "invoice_id">[]
  ) => {
    if (!organization?.id) throw new Error("No organization selected")

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0)
      return sum + lineTotal
    }, 0)

    const discountAmount = invoice.discount_percent
      ? subtotal * (invoice.discount_percent / 100)
      : (invoice.discount_amount || 0)

    const afterDiscount = subtotal - discountAmount
    const taxAmount = invoice.tax_percent
      ? afterDiscount * (invoice.tax_percent / 100)
      : (invoice.tax_amount || 0)

    const total = afterDiscount + taxAmount + (invoice.shipping_amount || 0) + (invoice.adjustment || 0)

    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("crm_invoices")
      .insert({
        ...invoice,
        organization_id: organization.id,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Create line items
    if (lineItems.length > 0) {
      const lineItemsWithInvoice = lineItems.map((item, index) => ({
        ...item,
        invoice_id: invoiceData.id,
        position: index,
        line_total: (item.quantity * item.unit_price) - (item.discount_amount || 0),
      }))

      const { error: lineItemsError } = await supabase
        .from("crm_invoice_line_items")
        .insert(lineItemsWithInvoice)

      if (lineItemsError) throw lineItemsError
    }

    await fetchInvoices()
    return invoiceData
  }

  const updateInvoice = async (
    id: string,
    updates: Partial<CRMInvoiceInsert>,
    lineItems?: Omit<CRMInvoiceLineItemInsert, "invoice_id">[]
  ) => {
    // If line items provided, recalculate totals
    if (lineItems) {
      const subtotal = lineItems.reduce((sum, item) => {
        const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0)
        return sum + lineTotal
      }, 0)

      const discountAmount = updates.discount_percent
        ? subtotal * (updates.discount_percent / 100)
        : (updates.discount_amount || 0)

      const afterDiscount = subtotal - discountAmount
      const taxAmount = updates.tax_percent
        ? afterDiscount * (updates.tax_percent / 100)
        : (updates.tax_amount || 0)

      const total = afterDiscount + taxAmount + (updates.shipping_amount || 0) + (updates.adjustment || 0)

      updates = {
        ...updates,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
      }

      // Delete existing line items and insert new ones
      await supabase.from("crm_invoice_line_items").delete().eq("invoice_id", id)

      if (lineItems.length > 0) {
        const lineItemsWithInvoice = lineItems.map((item, index) => ({
          ...item,
          invoice_id: id,
          position: index,
          line_total: (item.quantity * item.unit_price) - (item.discount_amount || 0),
        }))

        await supabase.from("crm_invoice_line_items").insert(lineItemsWithInvoice)
      }
    }

    const { data, error } = await supabase
      .from("crm_invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    await fetchInvoices()
    return data
  }

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase
      .from("crm_invoices")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    setInvoices((prev) => prev.filter((i) => i.id !== id))
  }

  const getInvoiceStats = useCallback(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const paid = invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
    const pending = invoices
      .filter((inv) => !["Paid", "Cancelled"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
    const overdue = invoices
      .filter((inv) => inv.status === "Overdue")
      .reduce((sum, inv) => sum + (inv.total || 0), 0)

    return { total, paid, pending, overdue, count: invoices.length }
  }, [invoices])

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceStats,
  }
}

// ============================================
// PRODUCTS HOOK
// ============================================
export function useProducts() {
  const [products, setProducts] = useState<CRMProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchProducts = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_products")
      .select("*")
      .eq("organization_id", organization.id)
      .order("product_name", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = async (product: Omit<CRMProduct, "id" | "organization_id" | "created_at" | "updated_at">) => {
    if (!organization?.id) throw new Error("No organization selected")

    const { data, error } = await supabase
      .from("crm_products")
      .insert({
        ...product,
        organization_id: organization.id,
      })
      .select()
      .single()

    if (error) throw error
    setProducts((prev) => [...prev, data])
    return data
  }

  const updateProduct = async (id: string, updates: Partial<CRMProduct>) => {
    const { data, error } = await supabase
      .from("crm_products")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("crm_products").delete().eq("id", id)

    if (error) throw error
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}

// ============================================
// CRM DASHBOARD STATS HOOK
// ============================================
export function useCRMDashboard() {
  const [stats, setStats] = useState<CRMDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { organization } = useAuthStore()
  const supabase = getCRMClient()

  const fetchStats = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)

    const [accounts, contacts, leads, deals, invoices] = await Promise.all([
      supabase
        .from("crm_accounts")
        .select("id", { count: "exact" })
        .eq("organization_id", organization.id)
        .is("deleted_at", null),
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact" })
        .eq("organization_id", organization.id)
        .is("deleted_at", null),
      supabase
        .from("crm_leads")
        .select("id", { count: "exact" })
        .eq("organization_id", organization.id)
        .is("deleted_at", null)
        .eq("converted", false),
      supabase
        .from("crm_deals")
        .select("id, amount, stage")
        .eq("organization_id", organization.id)
        .is("deleted_at", null),
      supabase
        .from("crm_invoices")
        .select("id, status")
        .eq("organization_id", organization.id)
        .is("deleted_at", null),
    ])

    const pipelineValue = ((deals.data || []) as { amount?: number; stage: string }[])
      .filter((d) => !["Closed Won", "Closed Lost"].includes(d.stage))
      .reduce((sum, d) => sum + (d.amount || 0), 0)

    const openInvoices = ((invoices.data || []) as { status: string }[]).filter(
      (i) => !["Paid", "Cancelled"].includes(i.status)
    ).length

    const overdueInvoices = ((invoices.data || []) as { status: string }[]).filter(
      (i) => i.status === "Overdue"
    ).length

    setStats({
      total_accounts: accounts.count || 0,
      total_contacts: contacts.count || 0,
      total_leads: leads.count || 0,
      total_deals: deals.count || 0,
      pipeline_value: pipelineValue,
      open_invoices: openInvoices,
      overdue_invoices: overdueInvoices,
      activities_today: 0, // TODO: Implement activities
    })

    setLoading(false)
  }, [organization?.id, supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, fetchStats }
}
