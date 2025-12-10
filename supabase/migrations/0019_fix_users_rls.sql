-- ============================================
-- FIX: Enable RLS on users table and ensure proper policies
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing user policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Parent tenant can view all users" ON users;
DROP POLICY IF EXISTS "Users can view org users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Simple policy: Users can ALWAYS see their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Users can see other users in same organization
CREATE POLICY "Users can view org users"
ON users FOR SELECT
USING (
  id IN (
    SELECT om.user_id FROM organization_members om
    WHERE om.organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
);

-- Parent tenant admins can see all users
CREATE POLICY "Parent tenant can view all users"
ON users FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- Service role has full access
CREATE POLICY "Service role full access users"
ON users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- FIX: Ensure organization_members RLS is correct
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Parent tenant can view all members" ON organization_members;
DROP POLICY IF EXISTS "organization_members_select" ON organization_members;

-- Users can see their own memberships
CREATE POLICY "Users can view own membership"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Users can see all members of orgs they belong to
CREATE POLICY "Users can view org members"
ON organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Parent tenant admins can see all memberships
CREATE POLICY "Parent tenant can view all members"
ON organization_members FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access org members"
ON organization_members FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- FIX: Ensure organizations RLS is correct
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Parent tenant can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Parent tenant can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;

-- Users can see organizations they're members of
CREATE POLICY "Users can view own organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Parent tenant admins can see all orgs
CREATE POLICY "Parent tenant can view all organizations"
ON organizations FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- Parent tenant admins can manage all orgs
CREATE POLICY "Parent tenant can manage all organizations"
ON organizations FOR ALL
USING (is_parent_tenant_admin(auth.uid()))
WITH CHECK (is_parent_tenant_admin(auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access organizations"
ON organizations FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
