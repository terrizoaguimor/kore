import type { Json } from "./database"

// ============================================
// KORE Link CRM Types (based on vtigerCRM)
// ============================================

// Enums
export type AccountType = "Customer" | "Prospect" | "Partner" | "Vendor" | "Competitor" | "Other"
export type LeadSource = "Web" | "Phone" | "Email" | "Referral" | "Partner" | "Trade Show" | "Social Media" | "Cold Call" | "Other"
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified" | "Converted" | "Lost"
export type DealStage = "Prospecting" | "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost"
export type InvoiceStatus = "Draft" | "Sent" | "Viewed" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled"
export type Priority = "Low" | "Medium" | "High" | "Urgent"
export type Rating = "Hot" | "Warm" | "Cold"

// ============================================
// CRM Accounts (Companies)
// ============================================
export interface CRMAccount {
  id: string
  organization_id: string
  owner_id: string | null

  // Basic Info
  account_no: string
  account_name: string
  parent_id: string | null
  account_type: AccountType | null
  industry: string | null
  annual_revenue: number
  rating: Rating | null
  ownership: string | null
  employees: number

  // Contact Info
  phone: string | null
  other_phone: string | null
  email: string | null
  secondary_email: string | null
  website: string | null
  fax: string | null

  // Billing Address
  billing_street: string | null
  billing_city: string | null
  billing_state: string | null
  billing_code: string | null
  billing_country: string | null

  // Shipping Address
  shipping_street: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_code: string | null
  shipping_country: string | null

  // Other
  description: string | null
  sic_code: string | null
  ticker_symbol: string | null
  email_opt_out: boolean

  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CRMAccountInsert {
  id?: string
  organization_id: string
  owner_id?: string | null
  account_no?: string
  account_name: string
  parent_id?: string | null
  account_type?: AccountType | null
  industry?: string | null
  annual_revenue?: number
  rating?: Rating | null
  ownership?: string | null
  employees?: number
  phone?: string | null
  other_phone?: string | null
  email?: string | null
  secondary_email?: string | null
  website?: string | null
  fax?: string | null
  billing_street?: string | null
  billing_city?: string | null
  billing_state?: string | null
  billing_code?: string | null
  billing_country?: string | null
  shipping_street?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_code?: string | null
  shipping_country?: string | null
  description?: string | null
  sic_code?: string | null
  ticker_symbol?: string | null
  email_opt_out?: boolean
}

// ============================================
// CRM Contacts
// ============================================
export interface CRMContact {
  id: string
  organization_id: string
  owner_id: string | null
  account_id: string | null

  // Basic Info
  contact_no: string
  salutation: string | null
  first_name: string | null
  last_name: string

  // Job Info
  title: string | null
  department: string | null

  // Contact Info
  email: string | null
  secondary_email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null

  // Mailing Address
  mailing_street: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_code: string | null
  mailing_country: string | null

  // Other Address
  other_street: string | null
  other_city: string | null
  other_state: string | null
  other_code: string | null
  other_country: string | null

  // Other
  description: string | null
  lead_source: LeadSource | null
  reports_to: string | null
  birthday: string | null
  do_not_call: boolean
  email_opt_out: boolean
  photo_url: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null

  // Relations (for joined queries)
  account?: CRMAccount | null
}

export interface CRMContactInsert {
  id?: string
  organization_id: string
  owner_id?: string | null
  account_id?: string | null
  contact_no?: string
  salutation?: string | null
  first_name?: string | null
  last_name: string
  title?: string | null
  department?: string | null
  email?: string | null
  secondary_email?: string | null
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  mailing_street?: string | null
  mailing_city?: string | null
  mailing_state?: string | null
  mailing_code?: string | null
  mailing_country?: string | null
  other_street?: string | null
  other_city?: string | null
  other_state?: string | null
  other_code?: string | null
  other_country?: string | null
  description?: string | null
  lead_source?: LeadSource | null
  reports_to?: string | null
  birthday?: string | null
  do_not_call?: boolean
  email_opt_out?: boolean
  photo_url?: string | null
}

// ============================================
// CRM Leads
// ============================================
export interface CRMLead {
  id: string
  organization_id: string
  owner_id: string | null

  // Basic Info
  lead_no: string
  salutation: string | null
  first_name: string | null
  last_name: string
  company: string

  // Contact Info
  email: string | null
  secondary_email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  website: string | null

  // Address
  street: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null

  // Lead Info
  lead_source: LeadSource | null
  lead_status: LeadStatus
  rating: Rating | null
  industry: string | null
  annual_revenue: number
  employees: number | null

  // Additional
  title: string | null
  description: string | null
  email_opt_out: boolean
  converted: boolean
  converted_contact_id: string | null
  converted_account_id: string | null
  converted_deal_id: string | null
  converted_at: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CRMLeadInsert {
  id?: string
  organization_id: string
  owner_id?: string | null
  lead_no?: string
  salutation?: string | null
  first_name?: string | null
  last_name: string
  company: string
  email?: string | null
  secondary_email?: string | null
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  website?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  lead_source?: LeadSource | null
  lead_status?: LeadStatus
  rating?: Rating | null
  industry?: string | null
  annual_revenue?: number
  employees?: number | null
  title?: string | null
  description?: string | null
  email_opt_out?: boolean
}

// ============================================
// CRM Deals (Potentials/Opportunities)
// ============================================
export interface CRMDeal {
  id: string
  organization_id: string
  owner_id: string | null
  account_id: string | null
  contact_id: string | null

  // Basic Info
  deal_no: string
  deal_name: string

  // Financial
  amount: number
  currency: string

  // Status
  stage: DealStage
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null

  // Source
  lead_source: LeadSource | null
  campaign_id: string | null

  // Details
  deal_type: string | null
  next_step: string | null
  description: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null

  // Relations (for joined queries)
  account?: CRMAccount | null
  contact?: CRMContact | null
}

export interface CRMDealInsert {
  id?: string
  organization_id: string
  owner_id?: string | null
  account_id?: string | null
  contact_id?: string | null
  deal_no?: string
  deal_name: string
  amount?: number
  currency?: string
  stage?: DealStage
  probability?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  lead_source?: LeadSource | null
  campaign_id?: string | null
  deal_type?: string | null
  next_step?: string | null
  description?: string | null
}

// ============================================
// CRM Invoices
// ============================================
export interface CRMInvoice {
  id: string
  organization_id: string
  owner_id: string | null
  account_id: string | null
  contact_id: string | null
  deal_id: string | null

  // Basic Info
  invoice_no: string
  subject: string

  // Dates
  invoice_date: string
  due_date: string

  // Status
  status: InvoiceStatus

  // Billing Address
  billing_street: string | null
  billing_city: string | null
  billing_state: string | null
  billing_code: string | null
  billing_country: string | null

  // Shipping Address
  shipping_street: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_code: string | null
  shipping_country: string | null

  // Financial
  subtotal: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  shipping_amount: number
  adjustment: number
  total: number
  currency: string

  // Other
  terms_conditions: string | null
  notes: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null

  // Relations (for joined queries)
  account?: CRMAccount | null
  contact?: CRMContact | null
  line_items?: CRMInvoiceLineItem[]
}

export interface CRMInvoiceInsert {
  id?: string
  organization_id: string
  owner_id?: string | null
  account_id?: string | null
  contact_id?: string | null
  deal_id?: string | null
  invoice_no?: string
  subject: string
  invoice_date?: string
  due_date: string
  status?: InvoiceStatus
  billing_street?: string | null
  billing_city?: string | null
  billing_state?: string | null
  billing_code?: string | null
  billing_country?: string | null
  shipping_street?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_code?: string | null
  shipping_country?: string | null
  subtotal?: number
  discount_percent?: number
  discount_amount?: number
  tax_percent?: number
  tax_amount?: number
  shipping_amount?: number
  adjustment?: number
  total?: number
  currency?: string
  terms_conditions?: string | null
  notes?: string | null
}

// ============================================
// CRM Invoice Line Items
// ============================================
export interface CRMInvoiceLineItem {
  id: string
  invoice_id: string

  // Product
  product_name: string
  product_code: string | null
  description: string | null

  // Pricing
  quantity: number
  unit_price: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  line_total: number

  // Position
  position: number

  // Metadata
  created_at: string
}

export interface CRMInvoiceLineItemInsert {
  id?: string
  invoice_id: string
  product_name: string
  product_code?: string | null
  description?: string | null
  quantity: number
  unit_price: number
  discount_percent?: number
  discount_amount?: number
  tax_percent?: number
  line_total?: number
  position?: number
}

// ============================================
// CRM Products
// ============================================
export interface CRMProduct {
  id: string
  organization_id: string

  // Basic Info
  product_code: string
  product_name: string
  description: string | null

  // Pricing
  unit_price: number
  currency: string

  // Category
  category: string | null

  // Status
  is_active: boolean

  // Stock
  quantity_in_stock: number | null

  // Metadata
  created_at: string
  updated_at: string
}

// ============================================
// CRM Activities/Tasks
// ============================================
export interface CRMActivity {
  id: string
  organization_id: string
  owner_id: string | null

  // Related To
  related_type: "account" | "contact" | "lead" | "deal" | null
  related_id: string | null

  // Activity Info
  activity_type: "call" | "meeting" | "task" | "email" | "note"
  subject: string
  description: string | null

  // Timing
  start_time: string | null
  end_time: string | null
  due_date: string | null

  // Status
  status: "planned" | "held" | "not_held" | "completed" | "pending"
  priority: Priority

  // Metadata
  created_at: string
  updated_at: string
}

// ============================================
// CRM Notes
// ============================================
export interface CRMNote {
  id: string
  organization_id: string
  owner_id: string | null

  // Related To
  related_type: "account" | "contact" | "lead" | "deal" | null
  related_id: string | null

  // Content
  title: string
  content: string | null

  // Metadata
  created_at: string
  updated_at: string
}

// ============================================
// Pipeline Stats
// ============================================
export interface PipelineStats {
  total_deals: number
  total_value: number
  by_stage: {
    stage: DealStage
    count: number
    value: number
  }[]
  won_value: number
  lost_value: number
  win_rate: number
}

// ============================================
// Dashboard Stats
// ============================================
export interface CRMDashboardStats {
  total_accounts: number
  total_contacts: number
  total_leads: number
  total_deals: number
  pipeline_value: number
  open_invoices: number
  overdue_invoices: number
  activities_today: number
}

// ============================================
// Search Results
// ============================================
export interface CRMSearchResult {
  type: "account" | "contact" | "lead" | "deal" | "invoice"
  id: string
  title: string
  subtitle: string | null
  metadata: Json
}
