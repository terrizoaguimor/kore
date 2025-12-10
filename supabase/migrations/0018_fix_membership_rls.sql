-- ============================================
-- FIX: Ensure users can always see their own memberships
-- ============================================

-- Drop and recreate organization_members policies
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Parent tenant can view all members" ON organization_members;

-- Users can always see their own membership
CREATE POLICY "Users can view own membership"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Users can see members in their organizations
CREATE POLICY "Users can view org members"
ON organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Parent tenant admins can see all
CREATE POLICY "Parent tenant can view all members"
ON organization_members FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- ============================================
-- FIX: Ensure users can see their organizations
-- ============================================

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Parent tenant can view all organizations" ON organizations;

-- Users can see organizations they belong to
CREATE POLICY "Users can view own organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Parent tenant admins can see all organizations
CREATE POLICY "Parent tenant can view all organizations"
ON organizations FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- ============================================
-- FIX: Ensure users can see themselves
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Parent tenant can view all users" ON users;

-- Users can see their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Parent tenant admins can see all users
CREATE POLICY "Parent tenant can view all users"
ON users FOR SELECT
USING (is_parent_tenant_admin(auth.uid()));

-- Users in same organization can see each other
CREATE POLICY "Users can view org users"
ON users FOR SELECT
USING (
  id IN (
    SELECT user_id FROM organization_members
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
);
