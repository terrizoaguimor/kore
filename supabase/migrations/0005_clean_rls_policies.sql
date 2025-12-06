-- Complete cleanup and recreation of RLS policies
-- This fixes the infinite recursion issue

-- Step 1: Drop ALL existing policies on organization_members
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'organization_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Drop ALL existing policies on organizations
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'organizations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Create or replace the helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$;

-- Step 4: Create clean organization_members policies
-- SELECT: Users can only see their own membership rows (no recursion)
CREATE POLICY "members_select_own" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: Only org owners/admins can add members (uses direct subquery with alias)
CREATE POLICY "members_insert_admin" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Only org owners/admins can update members
CREATE POLICY "members_update_admin" ON organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only org owners/admins can remove members
CREATE POLICY "members_delete_admin" ON organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Step 5: Create organizations policies using helper function
CREATE POLICY "orgs_select_member" ON organizations
  FOR SELECT USING (id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "orgs_update_admin" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT om.organization_id FROM organization_members AS om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "orgs_insert_any" ON organizations
  FOR INSERT WITH CHECK (true);
