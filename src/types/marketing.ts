// ============================================
// KORE Pulse - Marketing Types
// ============================================

// Enums
export type MarketingCampaignType =
  | 'email'
  | 'sms'
  | 'social_media'
  | 'direct_mail'
  | 'phone'
  | 'web'
  | 'multi_channel'

export type MarketingCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type MarketingTemplateType =
  | 'email'
  | 'sms'
  | 'social_post'
  | 'landing_page'
  | 'ad_copy'
  | 'blog_post'

export type AIContentType =
  | 'email'
  | 'social_post'
  | 'blog_post'
  | 'ad_copy'
  | 'landing_page'
  | 'proposal'
  | 'followup'
  | 'objection_response'

export type AIContentTone =
  | 'professional'
  | 'friendly'
  | 'urgent'
  | 'educational'
  | 'promotional'
  | 'casual'
  | 'formal'

export type AIContentLength = 'short' | 'medium' | 'long'

export type AutomationTriggerType =
  | 'event'
  | 'time_based'
  | 'webhook'
  | 'form_submission'
  | 'lead_status_change'
  | 'client_action'

export type AutomationStatus = 'active' | 'paused' | 'draft' | 'error'

// ============================================
// Campaign Types
// ============================================

export interface CampaignTargetAudience {
  ageRange?: {
    min?: number
    max?: number
  }
  location?: string[]
  interests?: string[]
  customerType?: 'new' | 'existing' | 'lapsed'
  tags?: string[]
}

export interface CampaignGoals {
  leads?: number
  conversions?: number
  revenue?: number
  openRate?: number
  clickRate?: number
}

export interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  leads: number
  conversions: number
}

export interface CampaignContent {
  subject?: string
  body?: string
  templateId?: string
  attachments?: string[]
}

export interface CampaignSettings {
  sendTime?: string
  timezone?: string
  abTest?: boolean
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface MarketingCampaign {
  id: string
  organization_id: string
  created_by: string | null
  campaign_no: string
  name: string
  description: string | null
  type: MarketingCampaignType
  status: MarketingCampaignStatus
  start_date: string | null
  end_date: string | null
  target_audience: CampaignTargetAudience
  budget: number
  goals: CampaignGoals
  metrics: CampaignMetrics
  content: CampaignContent
  settings: CampaignSettings
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MarketingCampaignInsert {
  organization_id: string
  created_by?: string
  name: string
  description?: string
  type: MarketingCampaignType
  status?: MarketingCampaignStatus
  start_date?: string
  end_date?: string
  target_audience?: CampaignTargetAudience
  budget?: number
  goals?: CampaignGoals
  content?: CampaignContent
  settings?: CampaignSettings
}

// ============================================
// Template Types
// ============================================

export interface MarketingTemplate {
  id: string
  organization_id: string
  created_by: string | null
  name: string
  type: MarketingTemplateType
  description: string | null
  subject: string | null
  content: string
  html_content: string | null
  variables: string[]
  preview_text: string | null
  thumbnail_url: string | null
  usage_count: number
  last_used_at: string | null
  rating: number
  category: string | null
  tags: string[]
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface MarketingTemplateInsert {
  organization_id: string
  created_by?: string
  name: string
  type: MarketingTemplateType
  description?: string
  subject?: string
  content: string
  html_content?: string
  variables?: string[]
  preview_text?: string
  category?: string
  tags?: string[]
}

// ============================================
// AI Content Generation Types
// ============================================

export interface AIContentContext {
  clientName?: string
  productType?: string
  previousConversation?: string
  companyName?: string
}

export interface AIContentGeneration {
  id: string
  organization_id: string
  user_id: string
  content_type: AIContentType
  tone: AIContentTone
  length: AIContentLength
  topic: string
  keywords: string[]
  audience: string | null
  context: AIContentContext
  generated_content: string
  word_count: number
  model_used: string
  tokens_used: number
  generation_time_ms: number
  was_used: boolean
  used_in_campaign_id: string | null
  rating: number | null
  feedback: string | null
  created_at: string
}

export interface AIContentGenerationRequest {
  content_type: AIContentType
  tone?: AIContentTone
  length?: AIContentLength
  topic: string
  keywords?: string[]
  audience?: string
  context?: AIContentContext
}

export interface AIContentGenerationResponse {
  content: string
  type: AIContentType
  topic: string
  tone: AIContentTone
  length: AIContentLength
  generatedAt: string
  wordCount: number
  suggestions: string[]
}

// ============================================
// Automation Types
// ============================================

export interface AutomationTriggerConfig {
  eventName?: string
  conditions?: Record<string, unknown>[]
  schedule?: string // cron expression
  timezone?: string
  endpoint?: string
  method?: string
}

export interface AutomationStep {
  id: string
  type: 'send_email' | 'send_sms' | 'wait' | 'condition' | 'update_record' | 'create_task' | 'notify'
  config: Record<string, unknown>
  nextStepId?: string
  conditions?: Record<string, unknown>[]
}

export interface AutomationSettings {
  maxExecutionsPerDay?: number
  pauseOnError?: boolean
  notifyOnFailure?: boolean
}

export interface MarketingAutomation {
  id: string
  organization_id: string
  created_by: string | null
  name: string
  description: string | null
  status: AutomationStatus
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: AutomationStep[]
  total_executions: number
  successful_executions: number
  failed_executions: number
  last_execution_at: string | null
  last_execution_status: string | null
  settings: AutomationSettings
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MarketingAutomationInsert {
  organization_id: string
  created_by?: string
  name: string
  description?: string
  status?: AutomationStatus
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: AutomationStep[]
  settings?: AutomationSettings
}

// ============================================
// Automation Execution Types
// ============================================

export interface ExecutionLogEntry {
  stepId: string
  status: 'success' | 'failed' | 'skipped'
  timestamp: string
  result?: Record<string, unknown>
  error?: string
}

export interface AutomationExecution {
  id: string
  automation_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at: string | null
  triggered_by: string
  trigger_data: Record<string, unknown>
  steps_executed: number
  steps_successful: number
  steps_failed: number
  execution_log: ExecutionLogEntry[]
  error_message: string | null
  related_lead_id: string | null
  related_contact_id: string | null
  related_account_id: string | null
}

// ============================================
// Campaign Recipients Types
// ============================================

export type RecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'unsubscribed'
  | 'failed'

export interface CampaignRecipient {
  id: string
  campaign_id: string
  email: string | null
  phone: string | null
  lead_id: string | null
  contact_id: string | null
  status: RecipientStatus
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  open_count: number
  click_count: number
  clicked_links: string[]
  error_message: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Analytics & Stats Types
// ============================================

export interface CampaignAnalytics {
  campaignId: string
  campaignName: string
  metrics: CampaignMetrics
  performance: {
    openRate: number
    clickRate: number
    conversionRate: number
    costPerLead: number
    roi: number
  }
  goals: CampaignGoals
  progress: {
    leadsProgress: number
    conversionsProgress: number
  }
}

export interface MarketingDashboardStats {
  activeCampaigns: number
  totalReach: number
  conversionRate: number
  averageROI: number
  templateCount: number
  automationCount: number
  aiGenerationsThisMonth: number
  aiGenerationsLimit: number
}

export interface CampaignStatCard {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}
