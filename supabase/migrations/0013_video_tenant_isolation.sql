-- ============================================
-- VIDEO TENANT ISOLATION - Additional Policies
-- ============================================

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can create sessions in their rooms" ON video_sessions;
CREATE POLICY "Users can create sessions in their rooms"
ON video_sessions FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update sessions in their rooms" ON video_sessions;
CREATE POLICY "Users can update sessions in their rooms"
ON video_sessions FOR UPDATE
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can add participants to their sessions" ON video_participants;
CREATE POLICY "Users can add participants to their sessions"
ON video_participants FOR INSERT
WITH CHECK (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update participants in their sessions" ON video_participants;
CREATE POLICY "Users can update participants in their sessions"
ON video_participants FOR UPDATE
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can create recordings in their organization" ON video_recordings;
CREATE POLICY "Users can create recordings in their organization"
ON video_recordings FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create compositions in their organization" ON video_compositions;
CREATE POLICY "Users can create compositions in their organization"
ON video_compositions FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- MEETING ROOM PRESENCE (Real-time tracking)
-- ============================================

-- Create a table for real-time presence tracking
CREATE TABLE IF NOT EXISTS meeting_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES video_rooms(room_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_meeting', 'disconnected')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Only one presence record per user per room
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE meeting_presence ENABLE ROW LEVEL SECURITY;

-- Users can view presence in their organization's rooms
DROP POLICY IF EXISTS "Users can view presence in their rooms" ON meeting_presence;
CREATE POLICY "Users can view presence in their rooms"
ON meeting_presence FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert their own presence
DROP POLICY IF EXISTS "Users can add their presence" ON meeting_presence;
CREATE POLICY "Users can add their presence"
ON meeting_presence FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can update their own presence
DROP POLICY IF EXISTS "Users can update their presence" ON meeting_presence;
CREATE POLICY "Users can update their presence"
ON meeting_presence FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own presence
DROP POLICY IF EXISTS "Users can delete their presence" ON meeting_presence;
CREATE POLICY "Users can delete their presence"
ON meeting_presence FOR DELETE
USING (user_id = auth.uid());

-- Service role can manage all presence
DROP POLICY IF EXISTS "Service role can manage meeting_presence" ON meeting_presence;
CREATE POLICY "Service role can manage meeting_presence"
ON meeting_presence FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for real-time queries
CREATE INDEX IF NOT EXISTS idx_meeting_presence_room ON meeting_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_meeting_presence_status ON meeting_presence(status);
CREATE INDEX IF NOT EXISTS idx_meeting_presence_last_seen ON meeting_presence(last_seen_at);

-- Enable real-time for meeting_presence (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meeting_presence;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- WAITING ROOM TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS waiting_room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES video_rooms(room_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  display_name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),

  -- Only one waiting entry per user per room
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE waiting_room ENABLE ROW LEVEL SECURITY;

-- Users can view waiting room for their organization's rooms
DROP POLICY IF EXISTS "Users can view waiting room in their rooms" ON waiting_room;
CREATE POLICY "Users can view waiting room in their rooms"
ON waiting_room FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can add themselves to waiting room
DROP POLICY IF EXISTS "Users can join waiting room" ON waiting_room;
CREATE POLICY "Users can join waiting room"
ON waiting_room FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update waiting room entries
DROP POLICY IF EXISTS "Admins can manage waiting room" ON waiting_room;
CREATE POLICY "Admins can manage waiting room"
ON waiting_room FOR UPDATE
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
);

-- Users can delete their own waiting entry
DROP POLICY IF EXISTS "Users can leave waiting room" ON waiting_room;
CREATE POLICY "Users can leave waiting room"
ON waiting_room FOR DELETE
USING (user_id = auth.uid());

-- Service role can manage waiting room
DROP POLICY IF EXISTS "Service role can manage waiting_room" ON waiting_room;
CREATE POLICY "Service role can manage waiting_room"
ON waiting_room FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for waiting room
CREATE INDEX IF NOT EXISTS idx_waiting_room_room ON waiting_room(room_id);
CREATE INDEX IF NOT EXISTS idx_waiting_room_status ON waiting_room(status);

-- Enable real-time for waiting_room (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE waiting_room;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- FUNCTION: Clean up stale presence records
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  -- Remove presence records not updated in 2 minutes
  DELETE FROM meeting_presence
  WHERE last_seen_at < NOW() - INTERVAL '2 minutes';

  -- Remove waiting room entries older than 1 hour
  DELETE FROM waiting_room
  WHERE status = 'waiting' AND requested_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE: Add organization_id helper function
-- ============================================

CREATE OR REPLACE FUNCTION get_room_organization_id(p_room_id TEXT)
RETURNS UUID AS $$
  SELECT organization_id FROM video_rooms WHERE room_id = p_room_id;
$$ LANGUAGE sql STABLE;
