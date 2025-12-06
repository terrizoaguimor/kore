// ============================================
// KORE Voice - Voice & WhatsApp Types
// ============================================

// Enums
export type CallDirection = 'inbound' | 'outbound'

export type CallStatus =
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'voicemail'
  | 'failed'
  | 'cancelled'

export type WhatsAppMessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'template'
  | 'interactive'

export type ConversationStatus =
  | 'active'
  | 'pending'
  | 'resolved'
  | 'archived'

export type TranscriptionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

// ============================================
// Voice Call Types
// ============================================

export interface CallAIAnalysis {
  sentiment?: {
    overall: string
    confidence: number
    scores: {
      positive: number
      neutral: number
      negative: number
    }
    keyMoments?: Array<{
      timestamp: number
      emotion: string
      text: string
    }>
  }
  keywords?: Array<{
    keyword: string
    frequency: number
    relevance: number
  }>
  summary?: string
  actionItems?: string[]
  clientProfile?: {
    lifestage?: string
    priority?: string
    experience?: string
    decision_factors?: string[]
  }
  intent?: string
  urgency?: 'low' | 'medium' | 'high'
}

export interface VoiceCallLog {
  id: string
  organization_id: string
  user_id: string
  call_id: string | null
  direction: CallDirection
  status: CallStatus
  from_number: string
  to_number: string
  duration_seconds: number
  ring_duration_seconds: number
  talk_duration_seconds: number
  recording_url: string | null
  recording_duration_seconds: number | null
  transcription: string | null
  transcription_status: TranscriptionStatus | null
  ai_analysis: CallAIAnalysis
  lead_id: string | null
  contact_id: string | null
  account_id: string | null
  deal_id: string | null
  notes: string | null
  tags: string[]
  provider: string
  provider_data: Record<string, unknown>
  started_at: string | null
  answered_at: string | null
  ended_at: string | null
  created_at: string
}

export interface VoiceCallLogInsert {
  organization_id: string
  user_id: string
  call_id?: string
  direction: CallDirection
  status?: CallStatus
  from_number: string
  to_number: string
  duration_seconds?: number
  recording_url?: string
  transcription?: string
  notes?: string
  tags?: string[]
  lead_id?: string
  contact_id?: string
  account_id?: string
  deal_id?: string
  provider?: string
  provider_data?: Record<string, unknown>
  started_at?: string
  answered_at?: string
  ended_at?: string
}

// ============================================
// Voicemail Types
// ============================================

export interface VoicemailMessage {
  id: string
  organization_id: string
  user_id: string
  from_number: string
  duration_seconds: number
  recording_url: string
  transcription: string | null
  transcription_confidence: number | null
  is_read: boolean
  is_archived: boolean
  lead_id: string | null
  contact_id: string | null
  provider: string
  provider_id: string | null
  received_at: string
  read_at: string | null
  created_at: string
}

// ============================================
// WhatsApp Account Types
// ============================================

export interface WhatsAppBusinessHours {
  enabled: boolean
  timezone: string
  schedule: {
    [day: string]: {
      open: string
      close: string
    }
  }
}

export interface WhatsAppAccountSettings {
  autoReply?: boolean
  welcomeMessage?: string
  awayMessage?: string
  businessHours?: WhatsAppBusinessHours
}

export interface WhatsAppAccount {
  id: string
  organization_id: string
  phone_number_id: string
  display_phone_number: string
  business_account_id: string | null
  verified_name: string | null
  quality_rating: string | null
  settings: WhatsAppAccountSettings
  is_active: boolean
  webhook_verify_token: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppAccountInsert {
  organization_id: string
  phone_number_id: string
  display_phone_number: string
  business_account_id?: string
  verified_name?: string
  settings?: WhatsAppAccountSettings
}

// ============================================
// WhatsApp Conversation Types
// ============================================

export interface WhatsAppConversation {
  id: string
  organization_id: string
  whatsapp_account_id: string
  contact_phone: string
  contact_name: string | null
  contact_profile_pic: string | null
  lead_id: string | null
  contact_id: string | null
  status: ConversationStatus
  assigned_to: string | null
  message_count: number
  unread_count: number
  last_message_text: string | null
  last_message_at: string | null
  last_message_direction: 'inbound' | 'outbound' | null
  window_expires_at: string | null
  tags: string[]
  labels: string[]
  created_at: string
  updated_at: string
}

export interface WhatsAppConversationInsert {
  organization_id: string
  whatsapp_account_id: string
  contact_phone: string
  contact_name?: string
  contact_profile_pic?: string
  lead_id?: string
  contact_id?: string
  status?: ConversationStatus
  assigned_to?: string
  tags?: string[]
  labels?: string[]
}

// ============================================
// WhatsApp Message Types
// ============================================

export interface WhatsAppInteractiveData {
  type: 'button' | 'list' | 'product' | 'product_list'
  header?: {
    type: 'text' | 'image' | 'video' | 'document'
    text?: string
    media_id?: string
  }
  body?: {
    text: string
  }
  footer?: {
    text: string
  }
  action?: {
    buttons?: Array<{
      type: 'reply'
      reply: {
        id: string
        title: string
      }
    }>
    sections?: Array<{
      title: string
      rows: Array<{
        id: string
        title: string
        description?: string
      }>
    }>
  }
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
    header_handle?: string[]
  }
  buttons?: Array<{
    type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY'
    text: string
    phone_number?: string
    url?: string
  }>
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  wamid: string | null
  direction: 'inbound' | 'outbound'
  message_type: WhatsAppMessageType
  content: string | null
  media_url: string | null
  media_mime_type: string | null
  media_filename: string | null
  media_caption: string | null
  template_name: string | null
  template_language: string | null
  template_components: WhatsAppTemplateComponent[] | null
  interactive_type: string | null
  interactive_data: WhatsAppInteractiveData | null
  status: WhatsAppMessageStatus
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  error_code: string | null
  error_message: string | null
  reply_to_message_id: string | null
  created_at: string
}

export interface WhatsAppMessageInsert {
  conversation_id: string
  wamid?: string
  direction: 'inbound' | 'outbound'
  message_type?: WhatsAppMessageType
  content?: string
  media_url?: string
  media_mime_type?: string
  media_filename?: string
  media_caption?: string
  template_name?: string
  template_language?: string
  template_components?: WhatsAppTemplateComponent[]
  interactive_type?: string
  interactive_data?: WhatsAppInteractiveData
  status?: WhatsAppMessageStatus
  reply_to_message_id?: string
}

// ============================================
// WhatsApp Template Types
// ============================================

export type WhatsAppTemplateCategory =
  | 'AUTHENTICATION'
  | 'MARKETING'
  | 'UTILITY'

export type WhatsAppTemplateStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'

export interface WhatsAppTemplate {
  id: string
  organization_id: string
  whatsapp_account_id: string
  template_id: string | null
  name: string
  language: string
  category: WhatsAppTemplateCategory
  status: WhatsAppTemplateStatus
  components: WhatsAppTemplateComponent[]
  example: Record<string, unknown>
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppTemplateInsert {
  organization_id: string
  whatsapp_account_id: string
  template_id?: string
  name: string
  language?: string
  category: WhatsAppTemplateCategory
  components: WhatsAppTemplateComponent[]
  example?: Record<string, unknown>
}

// ============================================
// AI Analysis Types
// ============================================

export interface VoiceAnalysisRequest {
  audioUrl: string
  analysisType: 'transcription' | 'sentiment' | 'keywords' | 'summary'
  language?: string
}

export interface VoiceAnalysisTranscription {
  text: string
  confidence: number
  duration: number
  speakerCount: number
}

export interface VoiceAnalysisSentiment {
  overall: string
  confidence: number
  emotions: {
    concern: number
    interest: number
    uncertainty: number
    satisfaction?: number
  }
  keyMoments: Array<{
    timestamp: number
    emotion: string
    text: string
  }>
}

export interface VoiceAnalysisKeywords {
  topics: Array<{
    keyword: string
    frequency: number
    relevance: number
  }>
  intent: string
  urgency: 'low' | 'medium' | 'high'
}

export interface VoiceAnalysisSummary {
  summary: string
  actionItems: string[]
  clientProfile: {
    lifestage: string
    priority: string
    experience: string
    decision_factors: string[]
  }
}

export interface VoiceAnalysisResponse {
  audioUrl: string
  analysisType: string
  language: string
  result: VoiceAnalysisTranscription | VoiceAnalysisSentiment | VoiceAnalysisKeywords | VoiceAnalysisSummary
  processedAt: string
  processingTime: string
}

// ============================================
// AI Usage Types
// ============================================

export type AIService =
  | 'chat'
  | 'content_generation'
  | 'text_analysis'
  | 'voice_analysis'
  | 'transcription'

export interface AIUsage {
  id: string
  organization_id: string
  user_id: string
  service: AIService
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_cents: number
  request_type: string | null
  response_time_ms: number | null
  status: 'success' | 'error'
  error_message: string | null
  created_at: string
}

export interface AIUsageStats {
  period: string
  summary: {
    totalRequests: number
    totalTokens: number
    totalCost: number
    averageResponseTime: number
  }
  byService: {
    [service: string]: {
      requests: number
      tokens: number
      cost: number
      averageResponseTime: number
    }
  }
  byUser: Array<{
    userId: string
    requests: number
    cost: number
  }>
  trends: Array<{
    date: string
    requests: number
    cost: number
  }>
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface VoiceDashboardStats {
  callsToday: number
  callsChange: string
  averageCallDuration: string
  durationChange: string
  responseRate: string
  responseChange: string
  inQueue: number
  missedCalls: number
  voicemailCount: number
  unreadVoicemails: number
}

export interface WhatsAppDashboardStats {
  activeConversations: number
  conversationsChange: string
  unreadMessages: number
  avgResponseTime: string
  responseTimeChange: string
  templatesApproved: number
  templatesPending: number
}

export interface CallHistoryItem {
  id: string
  type: CallDirection
  number: string
  contact: string | null
  duration: string
  time: Date
  status: CallStatus
  recording: boolean
  notes?: string
}

export interface AgentStatus {
  status: 'available' | 'busy' | 'away' | 'offline'
  timeInStatus: string
  callsToday: number
  totalTalkTime: string
}
