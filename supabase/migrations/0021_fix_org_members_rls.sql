-- ============================================
-- FIX: Organization members query failing
-- The self-referencing subquery causes issues
-- ============================================

-- Drop problematic policy
DROP POLICY IF EXISTS "org_members_select_org" ON organization_members;

-- Create a SECURITY DEFINER function to check org membership
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Users can see all members of organizations they belong to
CREATE POLICY "org_members_select_org"
ON organization_members FOR SELECT
USING (user_belongs_to_org(organization_id));

-- ============================================
-- FIX: Make organizations more permissive for reads
-- ============================================

DROP POLICY IF EXISTS "organizations_select_member" ON organizations;

-- Users can see orgs they're members of (using SECURITY DEFINER function)
CREATE POLICY "organizations_select_member"
ON organizations FOR SELECT
USING (user_belongs_to_org(id));

-- ============================================
-- Ensure users table allows reading org members
-- ============================================

-- Simplify users policy - authenticated users can read users in their org
DROP POLICY IF EXISTS "users_select_authenticated" ON users;

CREATE OR REPLACE FUNCTION user_in_same_org(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om1
    INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE POLICY "users_select_same_org"
ON users FOR SELECT
USING (user_in_same_org(id));
