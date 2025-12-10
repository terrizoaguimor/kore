import { createClient } from "@/lib/supabase/server"
import type { NotificationType } from "@/types/notifications"

interface SendNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  link?: string
  data?: Record<string, unknown>
}

interface NotifyUsersParams {
  userIds: string[]
  type: NotificationType
  title: string
  message?: string
  link?: string
  data?: Record<string, unknown>
}

/**
 * Send a notification to a single user
 */
export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  data,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("notifications").insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      link: link || null,
      data: data || {},
      is_read: false,
    })

    if (error) {
      console.error("Error sending notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in sendNotification:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

/**
 * Send notifications to multiple users
 */
export async function notifyUsers({
  userIds,
  type,
  title,
  message,
  link,
  data,
}: NotifyUsersParams): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendNotification({
        userId,
        type,
        title,
        message,
        link,
        data,
      })
      if (!result.success && result.error) {
        errors.push(`User ${userId}: ${result.error}`)
      }
    })
  )

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC EVENTS
// ============================================

/**
 * Notify when a task is created and assigned
 */
export async function notifyTaskCreated({
  taskTitle,
  assignedTo,
  createdBy,
  taskId,
}: {
  taskTitle: string
  assignedTo: string
  createdBy: string
  taskId: string
}) {
  // Don't notify if user assigned to themselves
  if (assignedTo === createdBy) return { success: true }

  return sendNotification({
    userId: assignedTo,
    type: "task_created",
    title: "Nueva tarea asignada",
    message: taskTitle,
    link: `/tasks?task=${taskId}`,
    data: { task_id: taskId, created_by: createdBy },
  })
}

/**
 * Notify when a task is completed
 */
export async function notifyTaskCompleted({
  taskTitle,
  completedBy,
  notifyUserId,
  taskId,
}: {
  taskTitle: string
  completedBy: string
  notifyUserId: string
  taskId: string
}) {
  return sendNotification({
    userId: notifyUserId,
    type: "task_completed",
    title: "Tarea completada",
    message: taskTitle,
    link: `/tasks?task=${taskId}`,
    data: { task_id: taskId, completed_by: completedBy },
  })
}

/**
 * Notify when a task is assigned to someone
 */
export async function notifyTaskAssigned({
  taskTitle,
  assignedTo,
  assignedBy,
  taskId,
}: {
  taskTitle: string
  assignedTo: string
  assignedBy: string
  taskId: string
}) {
  // Don't notify if user assigned to themselves
  if (assignedTo === assignedBy) return { success: true }

  return sendNotification({
    userId: assignedTo,
    type: "task_assigned",
    title: "Tarea asignada a ti",
    message: taskTitle,
    link: `/tasks?task=${taskId}`,
    data: { task_id: taskId, assigned_by: assignedBy },
  })
}

/**
 * Notify about incoming call
 */
export async function notifyIncomingCall({
  callerName,
  callType,
  callId,
  userId,
}: {
  callerName: string
  callType: "audio" | "video"
  callId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "call_incoming",
    title: callType === "video" ? "Videollamada entrante" : "Llamada entrante",
    message: `${callerName} te está llamando`,
    link: `/talk/call/${callId}`,
    data: { call_id: callId, call_type: callType },
  })
}

/**
 * Notify about missed call
 */
export async function notifyMissedCall({
  callerName,
  callType,
  callId,
  userId,
}: {
  callerName: string
  callType: "audio" | "video"
  callId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "call_missed",
    title: "Llamada perdida",
    message: `${callerName} intentó llamarte`,
    link: `/talk`,
    data: { call_id: callId, call_type: callType },
  })
}

/**
 * Notify about WhatsApp message
 */
export async function notifyWhatsAppMessage({
  senderName,
  messagePreview,
  conversationId,
  userId,
}: {
  senderName: string
  messagePreview: string
  conversationId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "whatsapp_message",
    title: `WhatsApp: ${senderName}`,
    message: messagePreview,
    link: `/talk/${conversationId}`,
    data: { conversation_id: conversationId },
  })
}

/**
 * Notify about chat message
 */
export async function notifyChatMessage({
  senderName,
  messagePreview,
  roomId,
  userId,
}: {
  senderName: string
  messagePreview: string
  roomId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "chat_message",
    title: `Mensaje de ${senderName}`,
    message: messagePreview,
    link: `/talk/${roomId}`,
    data: { room_id: roomId },
  })
}

/**
 * Notify about meeting starting
 */
export async function notifyMeetingStarted({
  meetingTitle,
  meetingId,
  userIds,
}: {
  meetingTitle: string
  meetingId: string
  userIds: string[]
}) {
  return notifyUsers({
    userIds,
    type: "meeting_started",
    title: "Reunión iniciada",
    message: meetingTitle,
    link: `/meet/${meetingId}`,
    data: { meeting_id: meetingId },
  })
}

/**
 * Notify about meeting invite
 */
export async function notifyMeetingInvite({
  meetingTitle,
  invitedBy,
  meetingId,
  userId,
}: {
  meetingTitle: string
  invitedBy: string
  meetingId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "meeting_invite",
    title: "Invitación a reunión",
    message: meetingTitle,
    link: `/meet/${meetingId}`,
    data: { meeting_id: meetingId, invited_by: invitedBy },
  })
}

/**
 * Notify about file shared
 */
export async function notifyFileShared({
  fileName,
  sharedBy,
  fileId,
  userId,
}: {
  fileName: string
  sharedBy: string
  fileId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "file_shared",
    title: "Archivo compartido contigo",
    message: fileName,
    link: `/files/shared`,
    data: { file_id: fileId, shared_by: sharedBy },
  })
}

/**
 * Notify about calendar reminder
 */
export async function notifyCalendarReminder({
  eventTitle,
  eventTime,
  eventId,
  userId,
}: {
  eventTitle: string
  eventTime: string
  eventId: string
  userId: string
}) {
  return sendNotification({
    userId,
    type: "calendar_reminder",
    title: "Recordatorio de evento",
    message: `${eventTitle} - ${eventTime}`,
    link: `/calendar?event=${eventId}`,
    data: { event_id: eventId },
  })
}
