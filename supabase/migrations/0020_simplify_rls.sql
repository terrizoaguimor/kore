-- ============================================
-- SIMPLIFY RLS: Remove circular dependencies
-- ============================================

-- Temporarily disable RLS to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'organizations', 'organization_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE - Simple policies
-- ============================================

-- Users can always read their own profile
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (id = auth.uid());

-- Allow authenticated users to see other users (for member lists, etc.)
CREATE POLICY "users_select_authenticated"
ON users FOR SELECT
USING (auth.role() = 'authenticated');

-- Service role bypass
CREATE POLICY "users_service_role"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- ORGANIZATIONS TABLE - Simple policies
-- ============================================

-- Users can see orgs they're members of
CREATE POLICY "organizations_select_member"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  )
);

-- Users can update orgs they own/admin
CREATE POLICY "organizations_update_admin"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);

-- Service role bypass
CREATE POLICY "organizations_service_role"
ON organizations FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- ORGANIZATION_MEMBERS TABLE - Simple policies
-- ============================================

-- Users can see their own memberships
CREATE POLICY "org_members_select_own"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Users can see members of their orgs
CREATE POLICY "org_members_select_org"
ON organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id
    AND om2.user_id = auth.uid()
  )
);

-- Admins can insert/update/delete members
CREATE POLICY "org_members_manage_admin"
ON organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id
    AND om2.user_id = auth.uid()
    AND om2.role IN ('owner', 'admin')
  )
);

-- Service role bypass
CREATE POLICY "org_members_service_role"
ON organization_members FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- PARENT TENANT: Add global access policies
-- ============================================

-- Create a simple function without circular deps
CREATE OR REPLACE FUNCTION is_parent_tenant_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    INNER JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
    AND o.is_parent_tenant = TRUE
    AND om.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Parent tenant can see all orgs
CREATE POLICY "organizations_parent_tenant"
ON organizations FOR SELECT
USING (is_parent_tenant_user());

-- Parent tenant can manage all orgs
CREATE POLICY "organizations_parent_tenant_manage"
ON organizations FOR ALL
USING (is_parent_tenant_user());

-- Parent tenant can see all members
CREATE POLICY "org_members_parent_tenant"
ON organization_members FOR SELECT
USING (is_parent_tenant_user());

-- Parent tenant can see all users
CREATE POLICY "users_parent_tenant"
ON users FOR SELECT
USING (is_parent_tenant_user());
