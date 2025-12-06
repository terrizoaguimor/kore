-- ============================================
-- KORE Pulse - Marketing Module Schema
-- ============================================

-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Marketing Campaign Types
CREATE TYPE marketing_campaign_type AS ENUM (
  'email',
  'sms',
  'social_media',
  'direct_mail',
  'phone',
  'web',
  'multi_channel'
);

-- Marketing Campaign Status
CREATE TYPE marketing_campaign_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
);

-- Marketing Template Types
CREATE TYPE marketing_template_type AS ENUM (
  'email',
  'sms',
  'social_post',
  'landing_page',
  'ad_copy',
  'blog_post'
);

-- AI Content Types
CREATE TYPE ai_content_type AS ENUM (
  'email',
  'social_post',
  'blog_post',
  'ad_copy',
  'landing_page',
  'proposal',
  'followup',
  'objection_response'
);

-- AI Content Tone
CREATE TYPE ai_content_tone AS ENUM (
  'professional',
  'friendly',
  'urgent',
  'educational',
  'promotional',
  'casual',
  'formal'
);

-- Automation Trigger Types
CREATE TYPE automation_trigger_type AS ENUM (
  'event',
  'time_based',
  'webhook',
  'form_submission',
  'lead_status_change',
  'client_action'
);

-- Automation Status
CREATE TYPE automation_status AS ENUM (
  'active',
  'paused',
  'draft',
  'error'
);

-- ============================================
-- Marketing Campaigns Table
-- ============================================
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  -- Campaign Details
  campaign_no TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type marketing_campaign_type NOT NULL DEFAULT 'email',
  status marketing_campaign_status NOT NULL DEFAULT 'draft',

  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Target Audience
  target_audience JSONB DEFAULT '{}'::jsonb,
  -- Structure: { ageRange: {min, max}, location: [], interests: [], customerType: string, tags: [] }

  -- Budget & Goals
  budget DECIMAL(12, 2) DEFAULT 0,
  goals JSONB DEFAULT '{}'::jsonb,
  -- Structure: { leads: number, conversions: number, revenue: number, openRate: number, clickRate: number }

  -- Metrics (updated in real-time)
  metrics JSONB DEFAULT '{}'::jsonb,
  -- Structure: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, leads: 0, conversions: 0 }

  -- Content
  content JSONB DEFAULT '{}'::jsonb,
  -- Structure: { subject: string, body: string, templateId: string, attachments: [] }

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Structure: { sendTime: string, timezone: string, abTest: boolean, trackOpens: true, trackClicks: true }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Campaign number sequence
CREATE SEQUENCE IF NOT EXISTS marketing_campaign_seq START 1000;

-- ============================================
-- Marketing Templates Table
-- ============================================
CREATE TABLE marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  name TEXT NOT NULL,
  type marketing_template_type NOT NULL DEFAULT 'email',
  description TEXT,

  -- Template Content
  subject TEXT, -- For emails
  content TEXT NOT NULL,
  html_content TEXT, -- For rich HTML templates

  -- Variables/Placeholders
  variables JSONB DEFAULT '[]'::jsonb,
  -- Structure: ["firstName", "lastName", "companyName", "productType"]

  -- Preview
  preview_text TEXT,
  thumbnail_url TEXT,

  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  rating DECIMAL(2, 1) DEFAULT 0,

  -- Categorization
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI Content Generations Table
-- ============================================
CREATE TABLE ai_content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Generation Details
  content_type ai_content_type NOT NULL,
  tone ai_content_tone NOT NULL DEFAULT 'professional',
  length TEXT CHECK (length IN ('short', 'medium', 'long')) DEFAULT 'medium',

  -- Input
  topic TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  audience TEXT,
  context JSONB DEFAULT '{}'::jsonb,

  -- Output
  generated_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,

  -- AI Model Info
  model_used TEXT DEFAULT 'claude-3-haiku',
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,

  -- Usage
  was_used BOOLEAN DEFAULT false,
  used_in_campaign_id UUID REFERENCES marketing_campaigns(id),

  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Marketing Automation Workflows Table
-- ============================================
CREATE TABLE marketing_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  name TEXT NOT NULL,
  description TEXT,
  status automation_status NOT NULL DEFAULT 'draft',

  -- Trigger Configuration
  trigger_type automation_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure depends on trigger_type:
  -- event: { eventName: string, conditions: [] }
  -- time_based: { schedule: cron_expression, timezone: string }
  -- webhook: { endpoint: string, method: string }
  -- etc.

  -- Workflow Steps
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{ id: string, type: string, config: {}, nextStepId: string, conditions: [] }]

  -- Execution Stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  last_execution_status TEXT,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Structure: { maxExecutionsPerDay: number, pauseOnError: boolean, notifyOnFailure: boolean }

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Automation Execution Logs Table
-- ============================================
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES marketing_automations(id) ON DELETE CASCADE,

  -- Execution Details
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Trigger Info
  triggered_by TEXT, -- 'schedule', 'manual', 'webhook', 'event'
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Results
  steps_executed INTEGER DEFAULT 0,
  steps_successful INTEGER DEFAULT 0,
  steps_failed INTEGER DEFAULT 0,

  -- Logs
  execution_log JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ stepId: string, status: string, timestamp: string, result: {}, error: string }]

  error_message TEXT,

  -- Related Entities
  related_lead_id UUID,
  related_contact_id UUID,
  related_account_id UUID
);

-- ============================================
-- Campaign Recipients Table
-- ============================================
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,

  -- Recipient Info
  email TEXT,
  phone TEXT,

  -- Related Entity
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed')),

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  clicked_links JSONB DEFAULT '[]'::jsonb,

  -- Errors
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KORE Voice - Voice & WhatsApp Module Schema
-- ============================================

-- Call Direction
CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');

-- Call Status
CREATE TYPE call_status AS ENUM ('ringing', 'in_progress', 'completed', 'missed', 'voicemail', 'failed', 'cancelled');

-- WhatsApp Message Status
CREATE TYPE whatsapp_message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- WhatsApp Message Type
CREATE TYPE whatsapp_message_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'template', 'interactive');

-- ============================================
-- Voice Call Logs Table
-- ============================================
CREATE TABLE voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Call Details
  call_id TEXT UNIQUE, -- External provider ID (Aircall, Twilio, etc.)
  direction call_direction NOT NULL,
  status call_status NOT NULL DEFAULT 'ringing',

  -- Phone Numbers
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Duration
  duration_seconds INTEGER DEFAULT 0,
  ring_duration_seconds INTEGER DEFAULT 0,
  talk_duration_seconds INTEGER DEFAULT 0,

  -- Recording
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  transcription TEXT,
  transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),

  -- AI Analysis
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  -- Structure: { sentiment: {}, keywords: [], summary: string, actionItems: [], clientProfile: {} }

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),
  account_id UUID REFERENCES crm_accounts(id),
  deal_id UUID REFERENCES crm_deals(id),

  -- Notes
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  -- Provider Info
  provider TEXT DEFAULT 'aircall', -- aircall, twilio, etc.
  provider_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WhatsApp Accounts Table
-- ============================================
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- WhatsApp Business Account
  phone_number_id TEXT NOT NULL UNIQUE,
  display_phone_number TEXT NOT NULL,
  business_account_id TEXT,

  -- Verification
  verified_name TEXT,
  quality_rating TEXT,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Structure: { autoReply: boolean, welcomeMessage: string, awayMessage: string, businessHours: {} }

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Webhook
  webhook_verify_token TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WhatsApp Conversations Table
-- ============================================
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,

  -- Contact Info
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  contact_profile_pic TEXT,

  -- Related Entity
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Conversation State
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'resolved', 'archived')) DEFAULT 'active',
  assigned_to UUID REFERENCES users(id),

  -- Stats
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,

  -- Last Message Preview
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),

  -- Conversation Window (24h rule)
  window_expires_at TIMESTAMPTZ,

  -- Tags & Labels
  tags JSONB DEFAULT '[]'::jsonb,
  labels JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WhatsApp Messages Table
-- ============================================
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,

  -- Message ID from WhatsApp
  wamid TEXT UNIQUE, -- WhatsApp Message ID

  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Message Content
  message_type whatsapp_message_type NOT NULL DEFAULT 'text',
  content TEXT,

  -- Media (for image, video, audio, document)
  media_url TEXT,
  media_mime_type TEXT,
  media_filename TEXT,
  media_caption TEXT,

  -- Template (for template messages)
  template_name TEXT,
  template_language TEXT,
  template_components JSONB,

  -- Interactive (for interactive messages)
  interactive_type TEXT,
  interactive_data JSONB,

  -- Status
  status whatsapp_message_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Error
  error_code TEXT,
  error_message TEXT,

  -- Context (reply to)
  reply_to_message_id UUID REFERENCES whatsapp_messages(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WhatsApp Templates Table
-- ============================================
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,

  -- Template Info
  template_id TEXT, -- ID from Meta
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  category TEXT NOT NULL CHECK (category IN ('AUTHENTICATION', 'MARKETING', 'UTILITY')),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED')) DEFAULT 'PENDING',

  -- Components
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{ type: 'HEADER'|'BODY'|'FOOTER'|'BUTTONS', ... }]

  -- Example
  example JSONB DEFAULT '{}'::jsonb,

  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Voice Mail Messages Table
-- ============================================
CREATE TABLE voicemail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Voicemail Details
  from_number TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,

  -- Recording
  recording_url TEXT NOT NULL,
  transcription TEXT,
  transcription_confidence DECIMAL(3, 2),

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Related Entities
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Provider
  provider TEXT DEFAULT 'aircall',
  provider_id TEXT,

  received_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI Usage Tracking Table
-- ============================================
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Service
  service TEXT NOT NULL CHECK (service IN ('chat', 'content_generation', 'text_analysis', 'voice_analysis', 'transcription')),

  -- Model
  model TEXT NOT NULL,

  -- Usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost (in cents)
  cost_cents INTEGER DEFAULT 0,

  -- Request Details
  request_type TEXT,
  response_time_ms INTEGER,

  -- Status
  status TEXT CHECK (status IN ('success', 'error')) DEFAULT 'success',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Marketing Campaigns
CREATE INDEX idx_marketing_campaigns_org ON marketing_campaigns(organization_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_type ON marketing_campaigns(type);
CREATE INDEX idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);

-- Marketing Templates
CREATE INDEX idx_marketing_templates_org ON marketing_templates(organization_id);
CREATE INDEX idx_marketing_templates_type ON marketing_templates(type);

-- AI Content Generations
CREATE INDEX idx_ai_content_generations_org ON ai_content_generations(organization_id);
CREATE INDEX idx_ai_content_generations_user ON ai_content_generations(user_id);
CREATE INDEX idx_ai_content_generations_type ON ai_content_generations(content_type);

-- Marketing Automations
CREATE INDEX idx_marketing_automations_org ON marketing_automations(organization_id);
CREATE INDEX idx_marketing_automations_status ON marketing_automations(status);

-- Voice Call Logs
CREATE INDEX idx_voice_call_logs_org ON voice_call_logs(organization_id);
CREATE INDEX idx_voice_call_logs_user ON voice_call_logs(user_id);
CREATE INDEX idx_voice_call_logs_status ON voice_call_logs(status);
CREATE INDEX idx_voice_call_logs_dates ON voice_call_logs(started_at);

-- WhatsApp Conversations
CREATE INDEX idx_whatsapp_conversations_org ON whatsapp_conversations(organization_id);
CREATE INDEX idx_whatsapp_conversations_account ON whatsapp_conversations(whatsapp_account_id);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_to);

-- WhatsApp Messages
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);

-- AI Usage
CREATE INDEX idx_ai_usage_org ON ai_usage(organization_id);
CREATE INDEX idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_service ON ai_usage(service);
CREATE INDEX idx_ai_usage_created ON ai_usage(created_at);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Marketing Campaigns Policies
CREATE POLICY "Users can view campaigns in their organization"
ON marketing_campaigns FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create campaigns in their organization"
ON marketing_campaigns FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update campaigns in their organization"
ON marketing_campaigns FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Marketing Templates Policies
CREATE POLICY "Users can view templates in their organization"
ON marketing_templates FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage templates in their organization"
ON marketing_templates FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- AI Content Generations Policies
CREATE POLICY "Users can view their AI generations"
ON ai_content_generations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create AI generations"
ON ai_content_generations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Voice Call Logs Policies
CREATE POLICY "Users can view call logs in their organization"
ON voice_call_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create call logs"
ON voice_call_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- WhatsApp Policies
CREATE POLICY "Users can view WhatsApp data in their organization"
ON whatsapp_accounts FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view conversations in their organization"
ON whatsapp_conversations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage conversations in their organization"
ON whatsapp_conversations FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their conversations"
ON whatsapp_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM whatsapp_conversations
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- AI Usage Policies
CREATE POLICY "Users can view their AI usage"
ON ai_usage FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create AI usage records"
ON ai_usage FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- Triggers
-- ============================================

-- Auto-generate campaign number
CREATE OR REPLACE FUNCTION generate_campaign_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_no IS NULL OR NEW.campaign_no = '' THEN
    NEW.campaign_no := 'CAMP-' || LPAD(nextval('marketing_campaign_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_campaign_no
BEFORE INSERT ON marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION generate_campaign_no();

-- Update timestamps
CREATE TRIGGER trigger_marketing_campaigns_updated
BEFORE UPDATE ON marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_marketing_templates_updated
BEFORE UPDATE ON marketing_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_marketing_automations_updated
BEFORE UPDATE ON marketing_automations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_whatsapp_accounts_updated
BEFORE UPDATE ON whatsapp_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_whatsapp_conversations_updated
BEFORE UPDATE ON whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated
BEFORE UPDATE ON whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update conversation stats on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET
    message_count = message_count + 1,
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END,
    last_message_text = NEW.content,
    last_message_at = NEW.created_at,
    last_message_direction = NEW.direction,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_name IS NOT NULL AND NEW.direction = 'outbound' THEN
    UPDATE whatsapp_templates
    SET
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE name = NEW.template_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_usage
AFTER INSERT ON whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION update_template_usage();
