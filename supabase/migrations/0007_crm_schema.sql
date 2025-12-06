-- KORE Link CRM Schema
-- Migration for CRM module (based on vtigerCRM structure)

-- ============================================
-- CRM ACCOUNTS (Companies)
-- ============================================
CREATE TABLE crm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Basic Info
  account_no TEXT NOT NULL,
  account_name TEXT NOT NULL,
  parent_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  account_type TEXT CHECK (account_type IN ('Customer', 'Prospect', 'Partner', 'Vendor', 'Competitor', 'Other')),
  industry TEXT,
  annual_revenue DECIMAL(15, 2) DEFAULT 0,
  rating TEXT CHECK (rating IN ('Hot', 'Warm', 'Cold')),
  ownership TEXT,
  employees INTEGER DEFAULT 0,

  -- Contact Info
  phone TEXT,
  other_phone TEXT,
  email TEXT,
  secondary_email TEXT,
  website TEXT,
  fax TEXT,

  -- Billing Address
  billing_street TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_code TEXT,
  billing_country TEXT,

  -- Shipping Address
  shipping_street TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_code TEXT,
  shipping_country TEXT,

  -- Other
  description TEXT,
  sic_code TEXT,
  ticker_symbol TEXT,
  email_opt_out BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Generate account number sequence
CREATE SEQUENCE crm_account_no_seq START 1000;

-- Function to generate account number
CREATE OR REPLACE FUNCTION generate_crm_account_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_no IS NULL OR NEW.account_no = '' THEN
    NEW.account_no := 'ACC-' || LPAD(nextval('crm_account_no_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_account_no
  BEFORE INSERT ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION generate_crm_account_no();

CREATE INDEX idx_crm_accounts_org ON crm_accounts(organization_id);
CREATE INDEX idx_crm_accounts_owner ON crm_accounts(owner_id);
CREATE INDEX idx_crm_accounts_name ON crm_accounts(account_name);
CREATE INDEX idx_crm_accounts_type ON crm_accounts(account_type);
CREATE INDEX idx_crm_accounts_deleted ON crm_accounts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_accounts_search ON crm_accounts USING GIN (
  to_tsvector('english', account_name || ' ' || coalesce(industry, '') || ' ' || coalesce(email, ''))
);

-- ============================================
-- CRM CONTACTS
-- ============================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,

  -- Basic Info
  contact_no TEXT NOT NULL,
  salutation TEXT,
  first_name TEXT,
  last_name TEXT NOT NULL,

  -- Job Info
  title TEXT,
  department TEXT,

  -- Contact Info
  email TEXT,
  secondary_email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,

  -- Mailing Address
  mailing_street TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_code TEXT,
  mailing_country TEXT,

  -- Other Address
  other_street TEXT,
  other_city TEXT,
  other_state TEXT,
  other_code TEXT,
  other_country TEXT,

  -- Other
  description TEXT,
  lead_source TEXT CHECK (lead_source IN ('Web', 'Phone', 'Email', 'Referral', 'Partner', 'Trade Show', 'Social Media', 'Cold Call', 'Other')),
  reports_to UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  birthday DATE,
  do_not_call BOOLEAN DEFAULT FALSE,
  email_opt_out BOOLEAN DEFAULT FALSE,
  photo_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Generate contact number sequence
CREATE SEQUENCE crm_contact_no_seq START 1000;

CREATE OR REPLACE FUNCTION generate_crm_contact_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_no IS NULL OR NEW.contact_no = '' THEN
    NEW.contact_no := 'CON-' || LPAD(nextval('crm_contact_no_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_contact_no
  BEFORE INSERT ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION generate_crm_contact_no();

CREATE INDEX idx_crm_contacts_org ON crm_contacts(organization_id);
CREATE INDEX idx_crm_contacts_owner ON crm_contacts(owner_id);
CREATE INDEX idx_crm_contacts_account ON crm_contacts(account_id);
CREATE INDEX idx_crm_contacts_name ON crm_contacts(last_name, first_name);
CREATE INDEX idx_crm_contacts_deleted ON crm_contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_contacts_search ON crm_contacts USING GIN (
  to_tsvector('english', coalesce(first_name, '') || ' ' || last_name || ' ' || coalesce(email, ''))
);

-- ============================================
-- CRM LEADS
-- ============================================
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Basic Info
  lead_no TEXT NOT NULL,
  salutation TEXT,
  first_name TEXT,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,

  -- Contact Info
  email TEXT,
  secondary_email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  website TEXT,

  -- Address
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,

  -- Lead Info
  lead_source TEXT CHECK (lead_source IN ('Web', 'Phone', 'Email', 'Referral', 'Partner', 'Trade Show', 'Social Media', 'Cold Call', 'Other')),
  lead_status TEXT NOT NULL DEFAULT 'New' CHECK (lead_status IN ('New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost')),
  rating TEXT CHECK (rating IN ('Hot', 'Warm', 'Cold')),
  industry TEXT,
  annual_revenue DECIMAL(15, 2) DEFAULT 0,
  employees INTEGER,

  -- Additional
  title TEXT,
  description TEXT,
  email_opt_out BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,
  converted_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  converted_account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  converted_deal_id UUID,  -- Will reference crm_deals after table creation
  converted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Generate lead number sequence
CREATE SEQUENCE crm_lead_no_seq START 1000;

CREATE OR REPLACE FUNCTION generate_crm_lead_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_no IS NULL OR NEW.lead_no = '' THEN
    NEW.lead_no := 'LEA-' || LPAD(nextval('crm_lead_no_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_lead_no
  BEFORE INSERT ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION generate_crm_lead_no();

CREATE INDEX idx_crm_leads_org ON crm_leads(organization_id);
CREATE INDEX idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX idx_crm_leads_status ON crm_leads(lead_status);
CREATE INDEX idx_crm_leads_source ON crm_leads(lead_source);
CREATE INDEX idx_crm_leads_converted ON crm_leads(converted) WHERE converted = FALSE;
CREATE INDEX idx_crm_leads_deleted ON crm_leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_leads_search ON crm_leads USING GIN (
  to_tsvector('english', coalesce(first_name, '') || ' ' || last_name || ' ' || company || ' ' || coalesce(email, ''))
);

-- ============================================
-- CRM DEALS (Potentials/Opportunities)
-- ============================================
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Basic Info
  deal_no TEXT NOT NULL,
  deal_name TEXT NOT NULL,

  -- Financial
  amount DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Status
  stage TEXT NOT NULL DEFAULT 'Prospecting' CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,

  -- Source
  lead_source TEXT CHECK (lead_source IN ('Web', 'Phone', 'Email', 'Referral', 'Partner', 'Trade Show', 'Social Media', 'Cold Call', 'Other')),
  campaign_id UUID,

  -- Details
  deal_type TEXT,
  next_step TEXT,
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Generate deal number sequence
CREATE SEQUENCE crm_deal_no_seq START 1000;

CREATE OR REPLACE FUNCTION generate_crm_deal_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_no IS NULL OR NEW.deal_no = '' THEN
    NEW.deal_no := 'DEA-' || LPAD(nextval('crm_deal_no_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_deal_no
  BEFORE INSERT ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION generate_crm_deal_no();

-- Add foreign key to leads for converted_deal_id
ALTER TABLE crm_leads ADD CONSTRAINT fk_lead_converted_deal
  FOREIGN KEY (converted_deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL;

CREATE INDEX idx_crm_deals_org ON crm_deals(organization_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_deals_account ON crm_deals(account_id);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_deleted ON crm_deals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_deals_search ON crm_deals USING GIN (
  to_tsvector('english', deal_name || ' ' || coalesce(description, ''))
);

-- ============================================
-- CRM PRODUCTS
-- ============================================
CREATE TABLE crm_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  unit_price DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Category
  category TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Stock
  quantity_in_stock INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate product code sequence
CREATE SEQUENCE crm_product_code_seq START 1000;

CREATE OR REPLACE FUNCTION generate_crm_product_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
    NEW.product_code := 'PRD-' || LPAD(nextval('crm_product_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_product_code
  BEFORE INSERT ON crm_products
  FOR EACH ROW EXECUTE FUNCTION generate_crm_product_code();

CREATE INDEX idx_crm_products_org ON crm_products(organization_id);
CREATE INDEX idx_crm_products_active ON crm_products(is_active) WHERE is_active = TRUE;

-- ============================================
-- CRM INVOICES
-- ============================================
CREATE TABLE crm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,

  -- Basic Info
  invoice_no TEXT NOT NULL,
  subject TEXT NOT NULL,

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')),

  -- Billing Address
  billing_street TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_code TEXT,
  billing_country TEXT,

  -- Shipping Address
  shipping_street TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_code TEXT,
  shipping_country TEXT,

  -- Financial
  subtotal DECIMAL(15, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_percent DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  shipping_amount DECIMAL(15, 2) DEFAULT 0,
  adjustment DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Other
  terms_conditions TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Generate invoice number sequence
CREATE SEQUENCE crm_invoice_no_seq START 1000;

CREATE OR REPLACE FUNCTION generate_crm_invoice_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    NEW.invoice_no := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(nextval('crm_invoice_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_crm_invoice_no
  BEFORE INSERT ON crm_invoices
  FOR EACH ROW EXECUTE FUNCTION generate_crm_invoice_no();

CREATE INDEX idx_crm_invoices_org ON crm_invoices(organization_id);
CREATE INDEX idx_crm_invoices_owner ON crm_invoices(owner_id);
CREATE INDEX idx_crm_invoices_account ON crm_invoices(account_id);
CREATE INDEX idx_crm_invoices_status ON crm_invoices(status);
CREATE INDEX idx_crm_invoices_due_date ON crm_invoices(due_date);
CREATE INDEX idx_crm_invoices_deleted ON crm_invoices(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- CRM INVOICE LINE ITEMS
-- ============================================
CREATE TABLE crm_invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES crm_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES crm_products(id) ON DELETE SET NULL,

  -- Product
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,

  -- Pricing
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  tax_percent DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(15, 2) DEFAULT 0,

  -- Position
  position INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_line_items_invoice ON crm_invoice_line_items(invoice_id);

-- Function to calculate line item total
CREATE OR REPLACE FUNCTION calculate_line_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_line_item_total
  BEFORE INSERT OR UPDATE ON crm_invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION calculate_line_item_total();

-- Function to update invoice totals when line items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  inv_id UUID;
  new_subtotal DECIMAL(15, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    inv_id := OLD.invoice_id;
  ELSE
    inv_id := NEW.invoice_id;
  END IF;

  SELECT COALESCE(SUM(line_total), 0) INTO new_subtotal
  FROM crm_invoice_line_items WHERE invoice_id = inv_id;

  UPDATE crm_invoices
  SET
    subtotal = new_subtotal,
    total = new_subtotal - discount_amount + tax_amount + shipping_amount + adjustment
  WHERE id = inv_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_on_line_item_change
  AFTER INSERT OR UPDATE OR DELETE ON crm_invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- ============================================
-- CRM ACTIVITIES
-- ============================================
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Related To
  related_type TEXT CHECK (related_type IN ('account', 'contact', 'lead', 'deal')),
  related_id UUID,

  -- Activity Info
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'task', 'email', 'note')),
  subject TEXT NOT NULL,
  description TEXT,

  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  due_date DATE,

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'held', 'not_held', 'completed', 'pending')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_org ON crm_activities(organization_id);
CREATE INDEX idx_crm_activities_owner ON crm_activities(owner_id);
CREATE INDEX idx_crm_activities_related ON crm_activities(related_type, related_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_due ON crm_activities(due_date) WHERE due_date IS NOT NULL;

-- ============================================
-- CRM NOTES
-- ============================================
CREATE TABLE crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Related To
  related_type TEXT CHECK (related_type IN ('account', 'contact', 'lead', 'deal')),
  related_id UUID,

  -- Content
  title TEXT NOT NULL,
  content TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_notes_org ON crm_notes(organization_id);
CREATE INDEX idx_crm_notes_related ON crm_notes(related_type, related_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_crm_accounts_updated_at BEFORE UPDATE ON crm_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON crm_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_products_updated_at BEFORE UPDATE ON crm_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_invoices_updated_at BEFORE UPDATE ON crm_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_notes_updated_at BEFORE UPDATE ON crm_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

-- CRM Accounts Policies
CREATE POLICY "Users can view CRM accounts in their organizations" ON crm_accounts
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert CRM accounts in their organizations" ON crm_accounts
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update CRM accounts in their organizations" ON crm_accounts
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete CRM accounts they own" ON crm_accounts
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- CRM Contacts Policies
CREATE POLICY "Users can view CRM contacts in their organizations" ON crm_contacts
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert CRM contacts in their organizations" ON crm_contacts
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update CRM contacts in their organizations" ON crm_contacts
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete CRM contacts they own" ON crm_contacts
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- CRM Leads Policies
CREATE POLICY "Users can view CRM leads in their organizations" ON crm_leads
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert CRM leads in their organizations" ON crm_leads
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update CRM leads in their organizations" ON crm_leads
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete CRM leads they own" ON crm_leads
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- CRM Deals Policies
CREATE POLICY "Users can view CRM deals in their organizations" ON crm_deals
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert CRM deals in their organizations" ON crm_deals
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update CRM deals in their organizations" ON crm_deals
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete CRM deals they own" ON crm_deals
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- CRM Products Policies
CREATE POLICY "Users can view CRM products in their organizations" ON crm_products
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage CRM products in their organizations" ON crm_products
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- CRM Invoices Policies
CREATE POLICY "Users can view CRM invoices in their organizations" ON crm_invoices
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert CRM invoices in their organizations" ON crm_invoices
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update CRM invoices in their organizations" ON crm_invoices
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete CRM invoices they own" ON crm_invoices
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- CRM Invoice Line Items Policies
CREATE POLICY "Users can view invoice line items" ON crm_invoice_line_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM crm_invoices WHERE organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage invoice line items" ON crm_invoice_line_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM crm_invoices WHERE organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
        )
    );

-- CRM Activities Policies
CREATE POLICY "Users can view CRM activities in their organizations" ON crm_activities
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage CRM activities in their organizations" ON crm_activities
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

-- CRM Notes Policies
CREATE POLICY "Users can view CRM notes in their organizations" ON crm_notes
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage CRM notes in their organizations" ON crm_notes
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );
