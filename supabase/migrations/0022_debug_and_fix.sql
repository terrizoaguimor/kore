-- ============================================
-- DEBUG: Disable RLS temporarily on core tables
-- to identify the root cause
-- ============================================

-- Disable RLS on core tables for now
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Ensure the user has a membership in their organization
-- First, find the organization and user
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_membership_exists BOOLEAN;
BEGIN
  -- Get the parent tenant org
  SELECT id INTO v_org_id FROM organizations WHERE is_parent_tenant = TRUE LIMIT 1;

  -- If no parent tenant, get any org
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
  END IF;

  -- Get any user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_org_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Check if membership exists
    SELECT EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = v_org_id AND user_id = v_user_id
    ) INTO v_membership_exists;

    -- If no membership, create one
    IF NOT v_membership_exists THEN
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (v_org_id, v_user_id, 'owner')
      ON CONFLICT (organization_id, user_id) DO NOTHING;

      RAISE NOTICE 'Created membership for user % in org %', v_user_id, v_org_id;
    ELSE
      RAISE NOTICE 'Membership already exists for user % in org %', v_user_id, v_org_id;
    END IF;
  END IF;
END $$;

-- Also ensure user record exists in public.users
INSERT INTO users (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(users.full_name, EXCLUDED.full_name);
