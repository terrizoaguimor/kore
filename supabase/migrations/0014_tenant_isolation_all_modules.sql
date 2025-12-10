-- ============================================
-- TENANT ISOLATION - All Modules Migration
-- Add organization_id to all tenant-scoped tables
-- All sections are conditional to handle missing tables
-- ============================================

-- ============================================
-- 1. SECURITY MODULE - Add organization_id
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_visits') THEN
    -- Add organization_id columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_visits' AND column_name = 'organization_id') THEN
      ALTER TABLE security_visits ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_security_visits_org ON security_visits(organization_id);

    -- Enable RLS and create policies
    ALTER TABLE security_visits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view security visits" ON security_visits;
    DROP POLICY IF EXISTS "System can insert security visits" ON security_visits;
    DROP POLICY IF EXISTS "Admins can view org security visits" ON security_visits;
    DROP POLICY IF EXISTS "Users can insert org security visits" ON security_visits;
    DROP POLICY IF EXISTS "Service role manage security_visits" ON security_visits;

    CREATE POLICY "Admins can view org security visits"
    ON security_visits FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Users can insert org security visits"
    ON security_visits FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) OR auth.role() = 'service_role');

    CREATE POLICY "Service role manage security_visits"
    ON security_visits FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_blocked_ips') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_blocked_ips' AND column_name = 'organization_id') THEN
      ALTER TABLE security_blocked_ips ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_security_blocked_ips_org ON security_blocked_ips(organization_id);

    ALTER TABLE security_blocked_ips ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view blocked IPs" ON security_blocked_ips;
    DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON security_blocked_ips;
    DROP POLICY IF EXISTS "Admins can view org blocked IPs" ON security_blocked_ips;
    DROP POLICY IF EXISTS "Admins can manage org blocked IPs" ON security_blocked_ips;
    DROP POLICY IF EXISTS "Service role manage security_blocked_ips" ON security_blocked_ips;

    CREATE POLICY "Admins can view org blocked IPs"
    ON security_blocked_ips FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Admins can manage org blocked IPs"
    ON security_blocked_ips FOR ALL
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Service role manage security_blocked_ips"
    ON security_blocked_ips FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_alerts' AND column_name = 'organization_id') THEN
      ALTER TABLE security_alerts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_security_alerts_org ON security_alerts(organization_id);

    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "System can insert security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "Admins can update security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "Admins can view org security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "Users can insert org security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "Admins can update org security alerts" ON security_alerts;
    DROP POLICY IF EXISTS "Service role manage security_alerts" ON security_alerts;

    CREATE POLICY "Admins can view org security alerts"
    ON security_alerts FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Users can insert org security alerts"
    ON security_alerts FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) OR auth.role() = 'service_role');

    CREATE POLICY "Admins can update org security alerts"
    ON security_alerts FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Service role manage security_alerts"
    ON security_alerts FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_api_log') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_api_log' AND column_name = 'organization_id') THEN
      ALTER TABLE security_api_log ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_security_api_log_org ON security_api_log(organization_id);

    ALTER TABLE security_api_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view API log" ON security_api_log;
    DROP POLICY IF EXISTS "System can insert API log" ON security_api_log;
    DROP POLICY IF EXISTS "Admins can view org API log" ON security_api_log;
    DROP POLICY IF EXISTS "Users can insert org API log" ON security_api_log;
    DROP POLICY IF EXISTS "Service role manage security_api_log" ON security_api_log;

    CREATE POLICY "Admins can view org API log"
    ON security_api_log FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

    CREATE POLICY "Users can insert org API log"
    ON security_api_log FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) OR auth.role() = 'service_role');

    CREATE POLICY "Service role manage security_api_log"
    ON security_api_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 2. PLANNING MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'organization_id') THEN
      ALTER TABLE plans ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_plans_org ON plans(organization_id);

    ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own plans" ON plans;
    DROP POLICY IF EXISTS "Users can create plans" ON plans;
    DROP POLICY IF EXISTS "Users can update own plans" ON plans;
    DROP POLICY IF EXISTS "Users can delete own plans" ON plans;
    DROP POLICY IF EXISTS "Users can view org plans" ON plans;
    DROP POLICY IF EXISTS "Users can create org plans" ON plans;
    DROP POLICY IF EXISTS "Users can update org plans" ON plans;
    DROP POLICY IF EXISTS "Users can delete org plans" ON plans;
    DROP POLICY IF EXISTS "Service role full access plans" ON plans;

    CREATE POLICY "Users can view org plans"
    ON plans FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org plans"
    ON plans FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org plans"
    ON plans FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can delete org plans"
    ON plans FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Service role full access plans"
    ON plans FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_tasks') THEN
    ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view tasks via plan" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can create tasks via plan" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can update tasks via plan" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can delete tasks via plan" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can view org plan tasks" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can create org plan tasks" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can update org plan tasks" ON plan_tasks;
    DROP POLICY IF EXISTS "Users can delete org plan tasks" ON plan_tasks;
    DROP POLICY IF EXISTS "Service role full access plan_tasks" ON plan_tasks;

    CREATE POLICY "Users can view org plan tasks"
    ON plan_tasks FOR SELECT
    USING (plan_id IN (SELECT id FROM plans WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can create org plan tasks"
    ON plan_tasks FOR INSERT
    WITH CHECK (plan_id IN (SELECT id FROM plans WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can update org plan tasks"
    ON plan_tasks FOR UPDATE
    USING (plan_id IN (SELECT id FROM plans WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can delete org plan tasks"
    ON plan_tasks FOR DELETE
    USING (plan_id IN (SELECT id FROM plans WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Service role full access plan_tasks"
    ON plan_tasks FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 3. CHAT MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms') THEN
    ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_update" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_delete" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can view org chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can create org chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can update org chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can delete org chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Service role full access chat_rooms" ON chat_rooms;

    CREATE POLICY "Users can view org chat rooms"
    ON chat_rooms FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org chat rooms"
    ON chat_rooms FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org chat rooms"
    ON chat_rooms FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can delete org chat rooms"
    ON chat_rooms FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) AND created_by = auth.uid());

    CREATE POLICY "Service role full access chat_rooms"
    ON chat_rooms FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_room_participants') THEN
    ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chat_room_participants_select" ON chat_room_participants;
    DROP POLICY IF EXISTS "chat_room_participants_insert" ON chat_room_participants;
    DROP POLICY IF EXISTS "chat_room_participants_delete" ON chat_room_participants;
    DROP POLICY IF EXISTS "Users can view org chat participants" ON chat_room_participants;
    DROP POLICY IF EXISTS "Users can add org chat participants" ON chat_room_participants;
    DROP POLICY IF EXISTS "Users can remove chat participants" ON chat_room_participants;

    CREATE POLICY "Users can view org chat participants"
    ON chat_room_participants FOR SELECT
    USING (room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can add org chat participants"
    ON chat_room_participants FOR INSERT
    WITH CHECK (room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can remove chat participants"
    ON chat_room_participants FOR DELETE
    USING (user_id = auth.uid() OR room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;
    DROP POLICY IF EXISTS "Users can view org chat messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can send org chat messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can edit own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Service role full access chat_messages" ON chat_messages;

    CREATE POLICY "Users can view org chat messages"
    ON chat_messages FOR SELECT
    USING (room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can send org chat messages"
    ON chat_messages FOR INSERT
    WITH CHECK (sender_id = auth.uid() AND room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can edit own messages"
    ON chat_messages FOR UPDATE
    USING (sender_id = auth.uid());

    CREATE POLICY "Users can delete own messages"
    ON chat_messages FOR DELETE
    USING (sender_id = auth.uid());

    CREATE POLICY "Service role full access chat_messages"
    ON chat_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 4. VOICE CALLS MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_calls') THEN
    ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view calls in their organization" ON voice_calls;
    DROP POLICY IF EXISTS "Users can create calls" ON voice_calls;
    DROP POLICY IF EXISTS "Users can update calls in their organization" ON voice_calls;
    DROP POLICY IF EXISTS "Users can view org voice calls" ON voice_calls;
    DROP POLICY IF EXISTS "Users can create org voice calls" ON voice_calls;
    DROP POLICY IF EXISTS "Users can update org voice calls" ON voice_calls;
    DROP POLICY IF EXISTS "Service role full access voice_calls" ON voice_calls;

    CREATE POLICY "Users can view org voice calls"
    ON voice_calls FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org voice calls"
    ON voice_calls FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org voice calls"
    ON voice_calls FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Service role full access voice_calls"
    ON voice_calls FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_recordings') THEN
    ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view recordings in their organization" ON voice_recordings;
    DROP POLICY IF EXISTS "Users can view org voice recordings" ON voice_recordings;
    DROP POLICY IF EXISTS "Users can create org voice recordings" ON voice_recordings;
    DROP POLICY IF EXISTS "Service role full access voice_recordings" ON voice_recordings;

    CREATE POLICY "Users can view org voice recordings"
    ON voice_recordings FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org voice recordings"
    ON voice_recordings FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Service role full access voice_recordings"
    ON voice_recordings FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 5. FILES MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
    ALTER TABLE files ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view files in their organization" ON files;
    DROP POLICY IF EXISTS "Users can insert files in their organization" ON files;
    DROP POLICY IF EXISTS "Users can update files in their organization" ON files;
    DROP POLICY IF EXISTS "Users can delete files in their organization" ON files;
    DROP POLICY IF EXISTS "Users can view org files" ON files;
    DROP POLICY IF EXISTS "Users can create org files" ON files;
    DROP POLICY IF EXISTS "Users can update org files" ON files;
    DROP POLICY IF EXISTS "Users can delete org files" ON files;

    CREATE POLICY "Users can view org files"
    ON files FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org files"
    ON files FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org files"
    ON files FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can delete org files"
    ON files FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shares') THEN
    ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view shares for their files" ON shares;
    DROP POLICY IF EXISTS "Users can create shares" ON shares;
    DROP POLICY IF EXISTS "Users can view org shares" ON shares;
    DROP POLICY IF EXISTS "Users can create org shares" ON shares;
    DROP POLICY IF EXISTS "Users can update org shares" ON shares;
    DROP POLICY IF EXISTS "Users can delete org shares" ON shares;
    DROP POLICY IF EXISTS "Anyone can view share by token" ON shares;

    CREATE POLICY "Users can view org shares"
    ON shares FOR SELECT
    USING (file_id IN (SELECT id FROM files WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())) OR shared_with_user = auth.uid());

    CREATE POLICY "Users can create org shares"
    ON shares FOR INSERT
    WITH CHECK (file_id IN (SELECT id FROM files WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can update org shares"
    ON shares FOR UPDATE
    USING (file_id IN (SELECT id FROM files WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can delete org shares"
    ON shares FOR DELETE
    USING (file_id IN (SELECT id FROM files WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Anyone can view share by token"
    ON shares FOR SELECT
    USING (token IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 6. CALENDAR MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendars') THEN
    ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view calendars in their organization" ON calendars;
    DROP POLICY IF EXISTS "Users can create calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can view org calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can create org calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can update org calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can delete org calendars" ON calendars;

    CREATE POLICY "Users can view org calendars"
    ON calendars FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org calendars"
    ON calendars FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org calendars"
    ON calendars FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can delete org calendars"
    ON calendars FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) AND is_default = FALSE);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view events in their calendars" ON calendar_events;
    DROP POLICY IF EXISTS "Users can view org calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can create org calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can update org calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can delete org calendar events" ON calendar_events;

    CREATE POLICY "Users can view org calendar events"
    ON calendar_events FOR SELECT
    USING (calendar_id IN (SELECT id FROM calendars WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can create org calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (calendar_id IN (SELECT id FROM calendars WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can update org calendar events"
    ON calendar_events FOR UPDATE
    USING (calendar_id IN (SELECT id FROM calendars WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can delete org calendar events"
    ON calendar_events FOR DELETE
    USING (calendar_id IN (SELECT id FROM calendars WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
  END IF;
END $$;

-- ============================================
-- 7. CONTACTS MODULE (conditional)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_books') THEN
    ALTER TABLE contact_books ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view contact books in their org" ON contact_books;
    DROP POLICY IF EXISTS "Users can view org contact books" ON contact_books;
    DROP POLICY IF EXISTS "Users can create org contact books" ON contact_books;
    DROP POLICY IF EXISTS "Users can update org contact books" ON contact_books;
    DROP POLICY IF EXISTS "Users can delete org contact books" ON contact_books;

    CREATE POLICY "Users can view org contact books"
    ON contact_books FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can create org contact books"
    ON contact_books FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can update org contact books"
    ON contact_books FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

    CREATE POLICY "Users can delete org contact books"
    ON contact_books FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()) AND is_default = FALSE);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view org contacts" ON contacts;
    DROP POLICY IF EXISTS "Users can create org contacts" ON contacts;
    DROP POLICY IF EXISTS "Users can update org contacts" ON contacts;
    DROP POLICY IF EXISTS "Users can delete org contacts" ON contacts;

    CREATE POLICY "Users can view org contacts"
    ON contacts FOR SELECT
    USING (contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can create org contacts"
    ON contacts FOR INSERT
    WITH CHECK (contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can update org contacts"
    ON contacts FOR UPDATE
    USING (contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

    CREATE POLICY "Users can delete org contacts"
    ON contacts FOR DELETE
    USING (contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_emails') THEN
    ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage org contact emails" ON contact_emails;

    CREATE POLICY "Users can manage org contact emails"
    ON contact_emails FOR ALL
    USING (contact_id IN (SELECT id FROM contacts WHERE contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_phones') THEN
    ALTER TABLE contact_phones ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage org contact phones" ON contact_phones;

    CREATE POLICY "Users can manage org contact phones"
    ON contact_phones FOR ALL
    USING (contact_id IN (SELECT id FROM contacts WHERE contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_addresses') THEN
    ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage org contact addresses" ON contact_addresses;

    CREATE POLICY "Users can manage org contact addresses"
    ON contact_addresses FOR ALL
    USING (contact_id IN (SELECT id FROM contacts WHERE contact_book_id IN (SELECT id FROM contact_books WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 8. HELPER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_organization_id TO authenticated;
