-- RLS Policies for Talk, Tasks, and Notes modules

-- ============================================
-- CHAT ROOMS POLICIES
-- ============================================
CREATE POLICY "chat_rooms_select" ON chat_rooms
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "chat_rooms_insert" ON chat_rooms
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "chat_rooms_update" ON chat_rooms
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid() AND role IN ('owner', 'moderator'))
  );

CREATE POLICY "chat_rooms_delete" ON chat_rooms
  FOR DELETE USING (
    created_by = auth.uid() OR
    id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid() AND role = 'owner')
  );

-- ============================================
-- CHAT ROOM PARTICIPANTS POLICIES
-- ============================================
CREATE POLICY "chat_participants_select" ON chat_room_participants
  FOR SELECT USING (
    room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

CREATE POLICY "chat_participants_insert" ON chat_room_participants
  FOR INSERT WITH CHECK (
    room_id IN (SELECT id FROM chat_rooms WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

CREATE POLICY "chat_participants_update" ON chat_room_participants
  FOR UPDATE USING (
    user_id = auth.uid() OR
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid() AND role IN ('owner', 'moderator'))
  );

CREATE POLICY "chat_participants_delete" ON chat_room_participants
  FOR DELETE USING (
    user_id = auth.uid() OR
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid() AND role IN ('owner', 'moderator'))
  );

-- ============================================
-- CHAT MESSAGES POLICIES
-- ============================================
CREATE POLICY "chat_messages_select" ON chat_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "chat_messages_update" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "chat_messages_delete" ON chat_messages
  FOR DELETE USING (
    sender_id = auth.uid() OR
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid() AND role IN ('owner', 'moderator'))
  );

-- ============================================
-- CALLS POLICIES
-- ============================================
CREATE POLICY "calls_select" ON calls
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "calls_insert" ON calls
  FOR INSERT WITH CHECK (
    started_by = auth.uid() AND
    room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "calls_update" ON calls
  FOR UPDATE USING (
    started_by = auth.uid() OR
    id IN (SELECT call_id FROM call_participants WHERE user_id = auth.uid())
  );

-- ============================================
-- CALL PARTICIPANTS POLICIES
-- ============================================
CREATE POLICY "call_participants_select" ON call_participants
  FOR SELECT USING (
    call_id IN (SELECT id FROM calls WHERE room_id IN (SELECT room_id FROM chat_room_participants WHERE user_id = auth.uid()))
  );

CREATE POLICY "call_participants_insert" ON call_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "call_participants_update" ON call_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- TASK BOARDS POLICIES
-- ============================================
CREATE POLICY "task_boards_select" ON task_boards
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "task_boards_insert" ON task_boards
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "task_boards_update" ON task_boards
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "task_boards_delete" ON task_boards
  FOR DELETE USING (
    owner_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- TASK LISTS POLICIES
-- ============================================
CREATE POLICY "task_lists_select" ON task_lists
  FOR SELECT USING (
    board_id IN (SELECT id FROM task_boards WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

CREATE POLICY "task_lists_insert" ON task_lists
  FOR INSERT WITH CHECK (
    board_id IN (SELECT id FROM task_boards WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

CREATE POLICY "task_lists_update" ON task_lists
  FOR UPDATE USING (
    board_id IN (SELECT id FROM task_boards WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

CREATE POLICY "task_lists_delete" ON task_lists
  FOR DELETE USING (
    board_id IN (SELECT id FROM task_boards WHERE organization_id IN (SELECT public.get_user_organization_ids()))
  );

-- ============================================
-- TASKS POLICIES
-- ============================================
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    list_id IN (
      SELECT tl.id FROM task_lists AS tl
      JOIN task_boards AS tb ON tl.board_id = tb.id
      WHERE tb.organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    list_id IN (
      SELECT tl.id FROM task_lists AS tl
      JOIN task_boards AS tb ON tl.board_id = tb.id
      WHERE tb.organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    list_id IN (
      SELECT tl.id FROM task_lists AS tl
      JOIN task_boards AS tb ON tl.board_id = tb.id
      WHERE tb.organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    list_id IN (
      SELECT tl.id FROM task_lists AS tl
      JOIN task_boards AS tb ON tl.board_id = tb.id
      WHERE tb.organization_id IN (
        SELECT om.organization_id FROM organization_members AS om
        WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
      )
    )
  );

-- ============================================
-- NOTES POLICIES
-- ============================================
CREATE POLICY "notes_select" ON notes
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "notes_insert" ON notes
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT public.get_user_organization_ids())
  );

CREATE POLICY "notes_update" ON notes
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "notes_delete" ON notes
  FOR DELETE USING (
    owner_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- Enable Realtime for chat
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants;
