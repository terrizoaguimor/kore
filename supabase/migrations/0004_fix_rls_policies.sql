-- Fix RLS policies to avoid recursion issues

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their memberships" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON organization_members;

-- Create a helper function to get user's org IDs (bypasses RLS recursion)
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

-- Recreate organization_members policies (simpler)
CREATE POLICY "Users can view their memberships" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert memberships" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update memberships" ON organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete memberships" ON organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Organizations policy using the helper function
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (id IN (SELECT public.get_user_organization_ids()));

-- Update other policies to use the helper function
DROP POLICY IF EXISTS "Users can view files in their org" ON files;
DROP POLICY IF EXISTS "Users can insert files in their org" ON files;
DROP POLICY IF EXISTS "Users can update files in their org" ON files;
DROP POLICY IF EXISTS "Users can delete files in their org" ON files;

CREATE POLICY "Users can view files in their org" ON files
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can insert files in their org" ON files
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can update files in their org" ON files
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can delete files in their org" ON files
  FOR DELETE USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- Update calendar policies
DROP POLICY IF EXISTS "Users can view calendars in their org" ON calendars;
DROP POLICY IF EXISTS "Users can manage calendars in their org" ON calendars;

CREATE POLICY "Users can view calendars in their org" ON calendars
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can manage calendars in their org" ON calendars
  FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- Update calendar_events policies
DROP POLICY IF EXISTS "Users can view events in their calendars" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage events in their calendars" ON calendar_events;

CREATE POLICY "Users can view events in their calendars" ON calendar_events
  FOR SELECT USING (
    calendar_id IN (
      SELECT id FROM calendars
      WHERE organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

CREATE POLICY "Users can manage events in their calendars" ON calendar_events
  FOR ALL USING (
    calendar_id IN (
      SELECT id FROM calendars
      WHERE organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

-- Update contact_books policies
DROP POLICY IF EXISTS "Users can view contact books in their org" ON contact_books;
DROP POLICY IF EXISTS "Users can manage contact books in their org" ON contact_books;

CREATE POLICY "Users can view contact books in their org" ON contact_books
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can manage contact books in their org" ON contact_books
  FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view contacts in their contact books" ON contacts;
DROP POLICY IF EXISTS "Users can manage contacts in their contact books" ON contacts;

CREATE POLICY "Users can view contacts in their contact books" ON contacts
  FOR SELECT USING (
    contact_book_id IN (
      SELECT id FROM contact_books
      WHERE organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

CREATE POLICY "Users can manage contacts in their contact books" ON contacts
  FOR ALL USING (
    contact_book_id IN (
      SELECT id FROM contact_books
      WHERE organization_id IN (SELECT public.get_user_organization_ids())
    )
  );
