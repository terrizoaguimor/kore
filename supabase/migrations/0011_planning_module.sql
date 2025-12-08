-- ============================================
-- KORE PLANNING MODULE
-- Action Plans and Tasks
-- ============================================

-- Action Plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  start_date DATE,
  end_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planning Tasks table
CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID REFERENCES action_plans(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES planning_tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  assigned_to_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
  category TEXT NOT NULL DEFAULT 'OTHER' CHECK (category IN ('CAMPAIGN', 'CONTENT', 'SOCIAL', 'EVENT', 'MEETING', 'ADMIN', 'OTHER')),
  start_date DATE,
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES planning_tasks(id) ON DELETE CASCADE,
  depends_on_id UUID REFERENCES planning_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_plans_org ON action_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_year ON action_plans(year);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_created_by ON action_plans(created_by);

CREATE INDEX IF NOT EXISTS idx_planning_tasks_plan ON planning_tasks(action_plan_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_parent ON planning_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_assigned ON planning_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_status ON planning_tasks(status);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_due ON planning_tasks(due_date);

-- RLS Policies
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Action Plans policies
CREATE POLICY "Users can view plans in their organization"
ON action_plans FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create plans in their organization"
ON action_plans FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update plans in their organization"
ON action_plans FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete plans"
ON action_plans FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Planning Tasks policies
CREATE POLICY "Users can view tasks in their organization plans"
ON planning_tasks FOR SELECT
USING (
  action_plan_id IN (
    SELECT id FROM action_plans
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create tasks in their organization plans"
ON planning_tasks FOR INSERT
WITH CHECK (
  action_plan_id IN (
    SELECT id FROM action_plans
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update tasks in their organization plans"
ON planning_tasks FOR UPDATE
USING (
  action_plan_id IN (
    SELECT id FROM action_plans
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete tasks in their organization plans"
ON planning_tasks FOR DELETE
USING (
  action_plan_id IN (
    SELECT id FROM action_plans
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Task Dependencies policies
CREATE POLICY "Users can manage dependencies for their tasks"
ON task_dependencies FOR ALL
USING (
  task_id IN (
    SELECT id FROM planning_tasks WHERE action_plan_id IN (
      SELECT id FROM action_plans WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_planning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_updated_at();

CREATE TRIGGER update_planning_tasks_updated_at
  BEFORE UPDATE ON planning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_updated_at();
