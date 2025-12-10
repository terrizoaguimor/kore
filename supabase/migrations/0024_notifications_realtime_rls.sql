-- ============================================
-- NOTIFICATIONS: ENABLE REALTIME AND RLS POLICIES
-- ============================================

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
DROP POLICY IF EXISTS "notifications_user_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
DROP POLICY IF EXISTS "notifications_user_delete" ON notifications;
DROP POLICY IF EXISTS "notifications_service" ON notifications;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "notifications_user_select"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Any authenticated user can create notifications for any user
-- (This allows the system to create notifications for other users)
CREATE POLICY "notifications_user_insert"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_user_update"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_user_delete"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- Service role bypass for system operations
CREATE POLICY "notifications_service"
ON notifications FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 4. ENABLE REALTIME ON NOTIFICATIONS TABLE
-- ============================================

-- Add table to publication for realtime
DO $$
BEGIN
  -- Check if publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add notifications table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 5. ADD INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx
ON notifications (user_id, is_read)
WHERE is_read = false;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO service_role;
