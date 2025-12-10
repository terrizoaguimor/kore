-- ============================================
-- ENABLE RLS WITH CORRECT POLICIES
-- No circular dependencies, using proper bypass
-- ============================================

-- First, drop all existing policies on core tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('users', 'organizations', 'organization_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================

-- Check if user belongs to an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is parent tenant admin (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_is_parent_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    INNER JOIN organizations o ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
    AND o.is_parent_tenant = TRUE
    AND om.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get user IDs in same organizations as current user (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_org_user_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT om2.user_id
  FROM organization_members om1
  INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
  WHERE om1.user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can always see their own profile
CREATE POLICY "users_own_select"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can see others in their organization
CREATE POLICY "users_org_select"
ON users FOR SELECT
USING (id IN (SELECT auth_org_user_ids()));

-- Parent tenant admins see all
CREATE POLICY "users_parent_select"
ON users FOR SELECT
USING (auth_is_parent_admin());

-- Users can update own profile
CREATE POLICY "users_own_update"
ON users FOR UPDATE
USING (id = auth.uid());

-- Service role bypass
CREATE POLICY "users_service"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their organizations
CREATE POLICY "orgs_member_select"
ON organizations FOR SELECT
USING (id IN (SELECT auth_user_org_ids()));

-- Parent tenant admins see all
CREATE POLICY "orgs_parent_select"
ON organizations FOR SELECT
USING (auth_is_parent_admin());

-- Parent tenant admins can manage all
CREATE POLICY "orgs_parent_all"
ON organizations FOR ALL
USING (auth_is_parent_admin());

-- Service role bypass
CREATE POLICY "orgs_service"
ON organizations FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- ORGANIZATION_MEMBERS TABLE POLICIES
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "members_own_select"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Users can see members of their organizations
CREATE POLICY "members_org_select"
ON organization_members FOR SELECT
USING (organization_id IN (SELECT auth_user_org_ids()));

-- Parent tenant admins see all
CREATE POLICY "members_parent_select"
ON organization_members FOR SELECT
USING (auth_is_parent_admin());

-- Org admins can manage members
CREATE POLICY "members_admin_all"
ON organization_members FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Parent tenant admins can manage all
CREATE POLICY "members_parent_all"
ON organization_members FOR ALL
USING (auth_is_parent_admin());

-- Service role bypass
CREATE POLICY "members_service"
ON organization_members FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- Grant execute on functions
-- ============================================

GRANT EXECUTE ON FUNCTION auth_user_org_ids TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_parent_admin TO authenticated;
GRANT EXECUTE ON FUNCTION auth_org_user_ids TO authenticated;
