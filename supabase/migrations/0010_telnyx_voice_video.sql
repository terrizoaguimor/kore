-- ============================================
-- KORE Voice & Meet - Telnyx Integration Schema
-- ============================================

-- ============================================
-- VOICE CALLS TABLE (Telnyx Call Control)
-- ============================================
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Telnyx Identifiers
  call_control_id TEXT UNIQUE NOT NULL,
  call_session_id TEXT,
  call_leg_id TEXT,
  connection_id TEXT,

  -- Call Details
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'ringing', 'answered', 'bridged', 'on_hold',
    'completed', 'failed', 'busy', 'no_answer', 'cancelled'
  )),

  -- Phone Numbers (E.164 format)
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Call Disposition
  hangup_cause TEXT,
  hangup_source TEXT,
  sip_hangup_cause TEXT,

  -- Client State (custom data)
  client_state JSONB DEFAULT '{}'::jsonb,

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),
  account_id UUID REFERENCES crm_accounts(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOICE RECORDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Related Call
  call_control_id TEXT REFERENCES voice_calls(call_control_id) ON DELETE CASCADE,

  -- Recording Details
  recording_id TEXT UNIQUE,
  recording_url_mp3 TEXT,
  recording_url_wav TEXT,

  -- Duration & Size
  duration_seconds INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,

  -- Transcription
  transcription TEXT,
  transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_confidence DECIMAL(3, 2),

  -- AI Analysis
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_keywords JSONB DEFAULT '[]'::jsonb,
  ai_action_items JSONB DEFAULT '[]'::jsonb,

  -- Storage
  storage_path TEXT,
  is_deleted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO ROOMS TABLE (KORE Meet)
-- ============================================
CREATE TABLE IF NOT EXISTS video_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  -- Telnyx Room ID
  room_id TEXT UNIQUE NOT NULL,

  -- Room Details
  unique_name TEXT,
  max_participants INTEGER DEFAULT 50,
  enable_recording BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),

  -- Stats
  total_sessions INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Telnyx Identifiers
  session_id TEXT UNIQUE NOT NULL,
  room_id TEXT NOT NULL REFERENCES video_rooms(room_id) ON DELETE CASCADE,

  -- Session Details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Stats
  peak_participants INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Telnyx Identifiers
  participant_id TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL REFERENCES video_sessions(session_id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,

  -- User Info (if authenticated)
  user_id UUID REFERENCES users(id),
  display_name TEXT,

  -- Participation
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Context (custom data passed when joining)
  context JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO RECORDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Telnyx Identifiers
  recording_id TEXT UNIQUE NOT NULL,
  session_id TEXT REFERENCES video_sessions(session_id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,

  -- Recording Details
  status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'completed', 'failed')),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_secs INTEGER DEFAULT 0,

  -- File Info
  download_url TEXT,
  size_mb DECIMAL(10, 2) DEFAULT 0,

  -- Storage
  storage_path TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO COMPOSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Telnyx Identifiers
  composition_id TEXT UNIQUE NOT NULL,
  session_id TEXT REFERENCES video_sessions(session_id) ON DELETE CASCADE,

  -- Composition Details
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  format TEXT DEFAULT 'mp4',
  resolution TEXT DEFAULT '1280x720',

  -- File Info
  download_url TEXT,
  size_mb DECIMAL(10, 2) DEFAULT 0,
  duration_secs INTEGER DEFAULT 0,

  -- Error Info
  error TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- SCHEDULED MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  -- Meeting Details
  title TEXT NOT NULL,
  description TEXT,

  -- Room
  room_id TEXT REFERENCES video_rooms(room_id),

  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

  -- Settings
  enable_recording BOOLEAN DEFAULT false,
  enable_waiting_room BOOLEAN DEFAULT false,
  require_password BOOLEAN DEFAULT false,
  password_hash TEXT,

  -- Participants
  max_participants INTEGER DEFAULT 50,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEETING INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES scheduled_meetings(id) ON DELETE CASCADE,

  -- Invitee
  user_id UUID REFERENCES users(id),
  email TEXT,
  name TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),

  -- Response
  responded_at TIMESTAMPTZ,

  -- Role
  role TEXT DEFAULT 'attendee' CHECK (role IN ('host', 'co-host', 'attendee')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Voice Calls
CREATE INDEX IF NOT EXISTS idx_voice_calls_org ON voice_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_user ON voice_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_direction ON voice_calls(direction);
CREATE INDEX IF NOT EXISTS idx_voice_calls_started ON voice_calls(started_at);
CREATE INDEX IF NOT EXISTS idx_voice_calls_session ON voice_calls(call_session_id);

-- Voice Recordings
CREATE INDEX IF NOT EXISTS idx_voice_recordings_call ON voice_recordings(call_control_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_org ON voice_recordings(organization_id);

-- Video Rooms
CREATE INDEX IF NOT EXISTS idx_video_rooms_org ON video_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_status ON video_rooms(status);

-- Video Sessions
CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON video_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON video_sessions(status);

-- Video Participants
CREATE INDEX IF NOT EXISTS idx_video_participants_session ON video_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_video_participants_user ON video_participants(user_id);

-- Video Recordings
CREATE INDEX IF NOT EXISTS idx_video_recordings_session ON video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_room ON video_recordings(room_id);

-- Scheduled Meetings
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_org ON scheduled_meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_room ON scheduled_meetings(room_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_start ON scheduled_meetings(scheduled_start);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_invites ENABLE ROW LEVEL SECURITY;

-- Voice Calls Policies
CREATE POLICY "Users can view calls in their organization"
ON voice_calls FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create calls"
ON voice_calls FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update calls in their organization"
ON voice_calls FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Voice Recordings Policies
CREATE POLICY "Users can view recordings in their organization"
ON voice_recordings FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Video Rooms Policies
CREATE POLICY "Users can view rooms in their organization"
ON video_rooms FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rooms"
ON video_rooms FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update rooms in their organization"
ON video_rooms FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete rooms in their organization"
ON video_rooms FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Video Sessions Policies
CREATE POLICY "Users can view sessions in their rooms"
ON video_sessions FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Video Participants Policies
CREATE POLICY "Users can view participants in their sessions"
ON video_participants FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM video_rooms
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Video Recordings Policies
CREATE POLICY "Users can view video recordings in their organization"
ON video_recordings FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Video Compositions Policies
CREATE POLICY "Users can view compositions in their organization"
ON video_compositions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Scheduled Meetings Policies
CREATE POLICY "Users can view meetings in their organization"
ON scheduled_meetings FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create meetings"
ON scheduled_meetings FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update meetings they created or in their org"
ON scheduled_meetings FOR UPDATE
USING (
  created_by = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Meeting Invites Policies
CREATE POLICY "Users can view their invites"
ON meeting_invites FOR SELECT
USING (
  user_id = auth.uid() OR
  meeting_id IN (
    SELECT id FROM scheduled_meetings
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create invites for their meetings"
ON meeting_invites FOR INSERT
WITH CHECK (
  meeting_id IN (
    SELECT id FROM scheduled_meetings
    WHERE created_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER trigger_voice_calls_updated
BEFORE UPDATE ON voice_calls
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_video_rooms_updated
BEFORE UPDATE ON video_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_scheduled_meetings_updated
BEFORE UPDATE ON scheduled_meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update room stats on session end
CREATE OR REPLACE FUNCTION update_room_stats_on_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'active' THEN
    -- Calculate duration
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;

    -- Update room stats
    UPDATE video_rooms
    SET
      total_sessions = total_sessions + 1,
      total_duration_seconds = total_duration_seconds + NEW.duration_seconds,
      updated_at = NOW()
    WHERE room_id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_stats
BEFORE UPDATE ON video_sessions
FOR EACH ROW EXECUTE FUNCTION update_room_stats_on_session();

-- Update participant count on session
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update peak participants
  UPDATE video_sessions
  SET
    total_participants = total_participants + 1,
    peak_participants = GREATEST(
      peak_participants,
      (SELECT COUNT(*) FROM video_participants WHERE session_id = NEW.session_id AND left_at IS NULL)
    )
  WHERE session_id = NEW.session_id;

  -- Also update room total
  UPDATE video_rooms
  SET total_participants = total_participants + 1
  WHERE room_id = NEW.room_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_count
AFTER INSERT ON video_participants
FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

-- Calculate participant duration on leave
CREATE OR REPLACE FUNCTION calculate_participant_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_participant_duration
BEFORE UPDATE ON video_participants
FOR EACH ROW EXECUTE FUNCTION calculate_participant_duration();

-- Service role policies for Edge Functions
CREATE POLICY "Service role can manage voice_calls"
ON voice_calls FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage voice_recordings"
ON voice_recordings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage video_rooms"
ON video_rooms FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage video_sessions"
ON video_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage video_participants"
ON video_participants FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage video_recordings"
ON video_recordings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage video_compositions"
ON video_compositions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
