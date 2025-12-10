-- ============================================
-- PARENT TENANT CONFIGURATION
-- Only the parent tenant has access to:
-- - KORE Security module
-- - Admin panel (manage all organizations)
-- ============================================

-- Add is_parent_tenant column to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_parent_tenant BOOLEAN DEFAULT FALSE;

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_organizations_parent_tenant
ON organizations(is_parent_tenant)
WHERE is_parent_tenant = TRUE;

-- Create function to get parent tenant ID
CREATE OR REPLACE FUNCTION get_parent_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM organizations
    WHERE is_parent_tenant = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check if user is from parent tenant
CREATE OR REPLACE FUNCTION is_user_in_parent_tenant(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = user_uuid
    AND o.is_parent_tenant = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check if user is parent tenant admin
CREATE OR REPLACE FUNCTION is_parent_tenant_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = user_uuid
    AND o.is_parent_tenant = TRUE
    AND om.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- SECURITY MODULE - Parent Tenant Only Access
-- Update RLS policies to allow parent tenant
-- to see ALL security data across tenants
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Parent tenant can view all security visits" ON security_visits;
DROP POLICY IF EXISTS "Parent tenant can view all blocked IPs" ON security_blocked_ips;
DROP POLICY IF EXISTS "Parent tenant can manage all blocked IPs" ON security_blocked_ips;
DROP POLICY IF EXISTS "Parent tenant can view all security alerts" ON security_alerts;
DROP POLICY IF EXISTS "Parent tenant can manage all security alerts" ON security_alerts;

-- Security visits - Parent tenant sees ALL
CREATE POLICY "Parent tenant can view all security visits"
ON security_visits FOR SELECT
USING (
  is_parent_tenant_admin(auth.uid())
);

-- Blocked IPs - Parent tenant manages ALL
CREATE POLICY "Parent tenant can view all blocked IPs"
ON security_blocked_ips FOR SELECT
USING (
  is_parent_tenant_admin(auth.uid())
);

CREATE POLICY "Parent tenant can manage all blocked IPs"
ON security_blocked_ips FOR ALL
USING (
  is_parent_tenant_admin(auth.uid())
);

-- Security alerts - Parent tenant manages ALL
CREATE POLICY "Parent tenant can view all security alerts"
ON security_alerts FOR SELECT
USING (
  is_parent_tenant_admin(auth.uid())
);

CREATE POLICY "Parent tenant can manage all security alerts"
ON security_alerts FOR ALL
USING (
  is_parent_tenant_admin(auth.uid())
);

-- ============================================
-- ADMIN PANEL - Parent Tenant Only Access
-- The admin panel allows managing all orgs
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Parent tenant can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Parent tenant can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Parent tenant can view all users" ON users;
DROP POLICY IF EXISTS "Parent tenant can view all members" ON organization_members;

-- Organizations - Parent tenant can see and manage ALL
CREATE POLICY "Parent tenant can view all organizations"
ON organizations FOR SELECT
USING (
  -- Users can see their own org OR parent tenant admin sees all
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
  )
  OR is_parent_tenant_admin(auth.uid())
);

CREATE POLICY "Parent tenant can manage all organizations"
ON organizations FOR ALL
USING (
  is_parent_tenant_admin(auth.uid())
);

-- Users - Parent tenant admin can see all users
CREATE POLICY "Parent tenant can view all users"
ON users FOR SELECT
USING (
  auth.uid() = id
  OR is_parent_tenant_admin(auth.uid())
);

-- Organization members - Parent tenant can view all
CREATE POLICY "Parent tenant can view all members"
ON organization_members FOR SELECT
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
  OR is_parent_tenant_admin(auth.uid())
);

-- ============================================
-- NOTE: Run this manually to set parent tenant
-- UPDATE organizations SET is_parent_tenant = TRUE WHERE slug = 'your-parent-slug';
-- ============================================
