// ============================================
// NOTIFICATION TYPES AND CONSTANTS
// ============================================

export type NotificationType =
  | "task_created"
  | "task_completed"
  | "task_assigned"
  | "task_due"
  | "call_incoming"
  | "call_missed"
  | "call_completed"
  | "whatsapp_message"
  | "chat_message"
  | "file_shared"
  | "file_comment"
  | "calendar_reminder"
  | "meeting_started"
  | "meeting_invite"
  | "member_joined"
  | "member_left"
  | "system"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
}

export interface NotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  message?: string
  link?: string
  data?: Record<string, unknown>
}

// Notification type configurations
export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: string
    color: string
    sound?: boolean
    desktop?: boolean
  }
> = {
  task_created: {
    icon: "ListTodo",
    color: "#00E5FF",
    sound: false,
    desktop: true,
  },
  task_completed: {
    icon: "CheckCircle2",
    color: "#00D68F",
    sound: true,
    desktop: true,
  },
  task_assigned: {
    icon: "UserPlus",
    color: "#8B5CF6",
    sound: true,
    desktop: true,
  },
  task_due: {
    icon: "Clock",
    color: "#FFB830",
    sound: true,
    desktop: true,
  },
  call_incoming: {
    icon: "PhoneIncoming",
    color: "#00E5FF",
    sound: true,
    desktop: true,
  },
  call_missed: {
    icon: "PhoneMissed",
    color: "#FF4D4D",
    sound: true,
    desktop: true,
  },
  call_completed: {
    icon: "PhoneOff",
    color: "#A1A1AA",
    sound: false,
    desktop: false,
  },
  whatsapp_message: {
    icon: "MessageCircle",
    color: "#25D366",
    sound: true,
    desktop: true,
  },
  chat_message: {
    icon: "MessageSquare",
    color: "#00E5FF",
    sound: true,
    desktop: true,
  },
  file_shared: {
    icon: "Share2",
    color: "#8B5CF6",
    sound: false,
    desktop: true,
  },
  file_comment: {
    icon: "MessageSquare",
    color: "#00E5FF",
    sound: false,
    desktop: false,
  },
  calendar_reminder: {
    icon: "CalendarClock",
    color: "#FFB830",
    sound: true,
    desktop: true,
  },
  meeting_started: {
    icon: "Video",
    color: "#00E5FF",
    sound: true,
    desktop: true,
  },
  meeting_invite: {
    icon: "Calendar",
    color: "#8B5CF6",
    sound: true,
    desktop: true,
  },
  member_joined: {
    icon: "UserPlus",
    color: "#00D68F",
    sound: false,
    desktop: false,
  },
  member_left: {
    icon: "UserMinus",
    color: "#A1A1AA",
    sound: false,
    desktop: false,
  },
  system: {
    icon: "Info",
    color: "#A1A1AA",
    sound: false,
    desktop: false,
  },
}
