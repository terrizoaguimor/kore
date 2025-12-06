-- Migration: Office Documents Schema
-- Description: Adds tables for the Office module (documents, spreadsheets, presentations)

-- ============================================
-- OFFICE DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS office_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Untitled',
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'spreadsheet', 'presentation')),
  content TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  last_edited_by UUID REFERENCES users(id),
  folder_id UUID REFERENCES files(id) ON DELETE SET NULL, -- Can be stored in a folder
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_office_documents_org ON office_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_owner ON office_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_type ON office_documents(type);
CREATE INDEX IF NOT EXISTS idx_office_documents_starred ON office_documents(is_starred);
CREATE INDEX IF NOT EXISTS idx_office_documents_updated ON office_documents(updated_at DESC);

-- ============================================
-- DOCUMENT VERSIONS (for version history)
-- ============================================

CREATE TABLE IF NOT EXISTS office_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES office_documents(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_office_doc_versions_doc ON office_document_versions(document_id);

-- ============================================
-- DOCUMENT COLLABORATORS (for sharing)
-- ============================================

CREATE TABLE IF NOT EXISTS office_document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES office_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT, -- For external collaborators
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id),
  UNIQUE(document_id, email)
);

CREATE INDEX IF NOT EXISTS idx_office_doc_collab_doc ON office_document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_office_doc_collab_user ON office_document_collaborators(user_id);

-- ============================================
-- DOCUMENT COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS office_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES office_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  position JSONB, -- For inline comments: { page: 1, x: 100, y: 200 }
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  parent_id UUID REFERENCES office_document_comments(id) ON DELETE CASCADE, -- For replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_doc_comments_doc ON office_document_comments(document_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE office_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_document_comments ENABLE ROW LEVEL SECURITY;

-- Office Documents policies
CREATE POLICY "Users can view documents in their organization or shared with them"
ON office_documents FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
  OR id IN (
    SELECT document_id FROM office_document_collaborators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documents in their organization"
ON office_documents FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners and editors can update documents"
ON office_documents FOR UPDATE
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT document_id FROM office_document_collaborators
    WHERE user_id = auth.uid() AND permission = 'edit'
  )
);

CREATE POLICY "Only owners can delete documents"
ON office_documents FOR DELETE
USING (owner_id = auth.uid());

-- Document Versions policies
CREATE POLICY "Users can view versions of documents they can access"
ON office_document_versions FOR SELECT
USING (
  document_id IN (
    SELECT id FROM office_documents WHERE
      organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT document_id FROM office_document_collaborators WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Editors can create versions"
ON office_document_versions FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM office_documents WHERE
      owner_id = auth.uid()
      OR id IN (
        SELECT document_id FROM office_document_collaborators
        WHERE user_id = auth.uid() AND permission = 'edit'
      )
  )
);

-- Document Collaborators policies
CREATE POLICY "Users can view collaborators of documents they own or are part of"
ON office_document_collaborators FOR SELECT
USING (
  document_id IN (
    SELECT id FROM office_documents WHERE owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Owners can manage collaborators"
ON office_document_collaborators FOR ALL
USING (
  document_id IN (
    SELECT id FROM office_documents WHERE owner_id = auth.uid()
  )
);

-- Document Comments policies
CREATE POLICY "Users can view comments on accessible documents"
ON office_document_comments FOR SELECT
USING (
  document_id IN (
    SELECT id FROM office_documents WHERE
      organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT document_id FROM office_document_collaborators WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users with comment or edit permission can add comments"
ON office_document_comments FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM office_documents WHERE
      organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT document_id FROM office_document_collaborators
        WHERE user_id = auth.uid() AND permission IN ('comment', 'edit')
      )
  )
);

CREATE POLICY "Users can update their own comments"
ON office_document_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments or document owners can delete any"
ON office_document_comments FOR DELETE
USING (
  user_id = auth.uid()
  OR document_id IN (
    SELECT id FROM office_documents WHERE owner_id = auth.uid()
  )
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_office_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_office_documents_updated_at
  BEFORE UPDATE ON office_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_office_documents_updated_at();

CREATE TRIGGER trigger_office_doc_comments_updated_at
  BEFORE UPDATE ON office_document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_office_documents_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get document with collaborator count
CREATE OR REPLACE FUNCTION get_document_with_stats(doc_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  owner_id UUID,
  is_starred BOOLEAN,
  collaborator_count BIGINT,
  comment_count BIGINT,
  version_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.type,
    d.owner_id,
    d.is_starred,
    (SELECT COUNT(*) FROM office_document_collaborators WHERE document_id = d.id) as collaborator_count,
    (SELECT COUNT(*) FROM office_document_comments WHERE document_id = d.id AND parent_id IS NULL) as comment_count,
    (SELECT COUNT(*) FROM office_document_versions WHERE document_id = d.id) as version_count,
    d.created_at,
    d.updated_at
  FROM office_documents d
  WHERE d.id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
