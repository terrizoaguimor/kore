-- CloudHub Database Schema
-- Initial Migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (Tenants)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  storage_quota BIGINT DEFAULT 5368709120, -- 5GB default
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ORGANIZATION MEMBERS
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================
-- FILES AND FOLDERS
-- ============================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES files(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  mime_type TEXT,
  size BIGINT DEFAULT 0,
  storage_path TEXT,
  thumbnail_path TEXT,
  metadata JSONB DEFAULT '{}',
  is_starred BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_org ON files(organization_id);
CREATE INDEX idx_files_parent ON files(parent_id);
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_trashed ON files(is_trashed) WHERE is_trashed = FALSE;
CREATE INDEX idx_files_starred ON files(is_starred) WHERE is_starred = TRUE;
CREATE INDEX idx_files_search ON files USING GIN (to_tsvector('english', name));

-- Unique constraint for file names within same folder
CREATE UNIQUE INDEX idx_files_unique_name ON files(organization_id, parent_id, name) WHERE is_trashed = FALSE;

-- ============================================
-- FILE VERSIONS
-- ============================================
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_versions_file ON file_versions(file_id);

-- ============================================
-- SHARES
-- ============================================
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  shared_with_user UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  token TEXT UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'upload')),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shares_file ON shares(file_id);
CREATE INDEX idx_shares_token ON shares(token) WHERE token IS NOT NULL;
CREATE INDEX idx_shares_user ON shares(shared_with_user);

-- ============================================
-- FILE COMMENTS
-- ============================================
CREATE TABLE file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_comments_file ON file_comments(file_id);

-- ============================================
-- TAGS
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2f62ea',
  UNIQUE(organization_id, name)
);

CREATE TABLE file_tags (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);

-- ============================================
-- CALENDARS
-- ============================================
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2f62ea',
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendars_org ON calendars(organization_id);
CREATE INDEX idx_calendars_owner ON calendars(owner_id);

-- ============================================
-- CALENDAR EVENTS
-- ============================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_id UUID,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility TEXT DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private')),
  busy_status TEXT DEFAULT 'busy' CHECK (busy_status IN ('free', 'busy', 'tentative')),
  reminders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_calendar ON calendar_events(calendar_id);
CREATE INDEX idx_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_events_search ON calendar_events USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));

-- ============================================
-- EVENT ATTENDEES
-- ============================================
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
  role TEXT DEFAULT 'attendee' CHECK (role IN ('organizer', 'attendee', 'optional')),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_attendees_user ON event_attendees(user_id);

-- ============================================
-- CONTACT BOOKS
-- ============================================
CREATE TABLE contact_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_books_org ON contact_books(organization_id);
CREATE INDEX idx_contact_books_owner ON contact_books(owner_id);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_book_id UUID REFERENCES contact_books(id) ON DELETE CASCADE,
  prefix TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  nickname TEXT,
  organization TEXT,
  job_title TEXT,
  birthday DATE,
  notes TEXT,
  photo_url TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_book ON contacts(contact_book_id);
CREATE INDEX idx_contacts_search ON contacts USING GIN (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(organization, ''))
);

-- ============================================
-- CONTACT EMAILS
-- ============================================
CREATE TABLE contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  type TEXT DEFAULT 'personal' CHECK (type IN ('personal', 'work', 'other')),
  is_primary BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_contact_emails_contact ON contact_emails(contact_id);

-- ============================================
-- CONTACT PHONES
-- ============================================
CREATE TABLE contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  type TEXT DEFAULT 'mobile' CHECK (type IN ('mobile', 'home', 'work', 'fax', 'other')),
  is_primary BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_contact_phones_contact ON contact_phones(contact_id);

-- ============================================
-- CONTACT ADDRESSES
-- ============================================
CREATE TABLE contact_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  type TEXT DEFAULT 'home' CHECK (type IN ('home', 'work', 'other'))
);

CREATE INDEX idx_contact_addresses_contact ON contact_addresses(contact_id);

-- ============================================
-- CONTACT GROUPS
-- ============================================
CREATE TABLE contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_group_members (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, group_id)
);

-- ============================================
-- CHAT ROOMS
-- ============================================
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'public', 'channel')),
  description TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_rooms_org ON chat_rooms(organization_id);
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);

-- ============================================
-- CHAT ROOM PARTICIPANTS
-- ============================================
CREATE TABLE chat_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  last_read_at TIMESTAMPTZ,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_participants_room ON chat_room_participants(room_id);
CREATE INDEX idx_room_participants_user ON chat_room_participants(user_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'system')),
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON chat_messages(room_id);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_messages_created ON chat_messages(room_id, created_at DESC);

-- ============================================
-- CALLS
-- ============================================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'missed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  recording_path TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_calls_room ON calls(room_id);

-- ============================================
-- CALL PARTICIPANTS
-- ============================================
CREATE TABLE call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_off BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_call_participants_call ON call_participants(call_id);

-- ============================================
-- TASK BOARDS
-- ============================================
CREATE TABLE task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2f62ea',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_boards_org ON task_boards(organization_id);

-- ============================================
-- TASK LISTS
-- ============================================
CREATE TABLE task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_lists_board ON task_lists(board_id);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  labels JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_list ON tasks(list_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL;

-- ============================================
-- NOTES
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  folder_id UUID REFERENCES files(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_org ON notes(organization_id);
CREATE INDEX idx_notes_owner ON notes(owner_id);
CREATE INDEX idx_notes_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_org ON activity_logs(organization_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================
-- DOCUMENT SESSIONS (for collaborative editing)
-- ============================================
CREATE TABLE document_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  active_users JSONB DEFAULT '[]',
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_sessions_file ON document_sessions(file_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_comments_updated_at BEFORE UPDATE ON file_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Organization owners can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'owner')
    );

-- Organization members policies
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Organization admins can manage members" ON organization_members
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Files policies
CREATE POLICY "Users can view files in their organizations" ON files
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert files in their organizations" ON files
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update files they own or have edit access" ON files
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can delete files they own or have admin access" ON files
    FOR DELETE USING (
        owner_id = auth.uid() OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Add more policies as needed for other tables...
