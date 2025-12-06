-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate clean)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their memberships" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view files in their org" ON files;
DROP POLICY IF EXISTS "Users can insert files in their org" ON files;
DROP POLICY IF EXISTS "Users can update files in their org" ON files;
DROP POLICY IF EXISTS "Users can delete files in their org" ON files;
DROP POLICY IF EXISTS "Users can view calendars in their org" ON calendars;
DROP POLICY IF EXISTS "Users can manage calendars in their org" ON calendars;
DROP POLICY IF EXISTS "Users can view events in their calendars" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage events in their calendars" ON calendar_events;
DROP POLICY IF EXISTS "Users can view contact books in their org" ON contact_books;
DROP POLICY IF EXISTS "Users can manage contact books in their org" ON contact_books;
DROP POLICY IF EXISTS "Users can view contacts in their contact books" ON contacts;
DROP POLICY IF EXISTS "Users can manage contacts in their contact books" ON contacts;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Organizations policies - users can view orgs they're members of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Organization members policies
CREATE POLICY "Users can view their memberships" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owners can manage members" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Files policies
CREATE POLICY "Users can view files in their org" ON files
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files in their org" ON files
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in their org" ON files
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in their org" ON files
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Calendars policies
CREATE POLICY "Users can view calendars in their org" ON calendars
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage calendars in their org" ON calendars
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Calendar events policies
CREATE POLICY "Users can view events in their calendars" ON calendar_events
  FOR SELECT USING (
    calendar_id IN (
      SELECT id FROM calendars WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage events in their calendars" ON calendar_events
  FOR ALL USING (
    calendar_id IN (
      SELECT id FROM calendars WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Contact books policies
CREATE POLICY "Users can view contact books in their org" ON contact_books
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage contact books in their org" ON contact_books
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Contacts policies
CREATE POLICY "Users can view contacts in their contact books" ON contacts
  FOR SELECT USING (
    contact_book_id IN (
      SELECT id FROM contact_books WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage contacts in their contact books" ON contacts
  FOR ALL USING (
    contact_book_id IN (
      SELECT id FROM contact_books WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
