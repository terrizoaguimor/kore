"use client"

import { useEffect, useCallback, useRef } from "react"
import { getClient } from "@/lib/supabase/client"
import { useNotificationStore } from "@/stores/notification-store"
import type { Notification } from "@/types/notifications"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useNotifications() {
  const supabase = getClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    setNotifications,
    addNotification,
    updateNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    setLoading,
    setConnected,
  } = useNotificationStore()

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      setLoading(false)
      return
    }

    setNotifications(data as Notification[])
  }, [supabase, setNotifications, setLoading])

  // Subscribe to realtime changes
  const subscribeToRealtime = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Clean up existing subscription
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification
          addNotification(notification)

          // Play sound for important notifications
          playNotificationSound(notification)

          // Show browser notification if permitted
          showBrowserNotification(notification)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification
          updateNotification(notification.id, notification)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.old as { id: string }
          removeNotification(notification.id)
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED")
        if (status === "SUBSCRIBED") {
          console.log("✅ Notifications realtime connected")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Notifications realtime error")
        }
      })

    channelRef.current = channel
  }, [supabase, addNotification, updateNotification, removeNotification, setConnected])

  // Mark notification as read via API
  const handleMarkAsRead = useCallback(async (id: string) => {
    markAsRead(id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
  }, [supabase, markAsRead])

  // Mark all as read via API
  const handleMarkAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    markAllAsRead()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
  }, [supabase, markAllAsRead])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    removeNotification(id)

    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
  }, [supabase, removeNotification])

  // Initialize on mount
  useEffect(() => {
    fetchNotifications()
    subscribeToRealtime()

    // Request browser notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission()
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchNotifications, subscribeToRealtime, supabase])

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  }
}

// Helper function to play notification sound
function playNotificationSound(notification: Notification) {
  const soundTypes = [
    "task_completed",
    "task_assigned",
    "task_due",
    "call_incoming",
    "call_missed",
    "whatsapp_message",
    "chat_message",
    "calendar_reminder",
    "meeting_started",
    "meeting_invite",
  ]

  if (soundTypes.includes(notification.type)) {
    try {
      const audio = new Audio("/sounds/notification.mp3")
      audio.volume = 0.5
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      })
    } catch {
      // Silently fail
    }
  }
}

// Helper function to show browser notification
function showBrowserNotification(notification: Notification) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return

  const desktopTypes = [
    "task_completed",
    "task_assigned",
    "task_due",
    "call_incoming",
    "call_missed",
    "whatsapp_message",
    "chat_message",
    "calendar_reminder",
    "meeting_started",
    "meeting_invite",
    "file_shared",
    "task_created",
  ]

  if (desktopTypes.includes(notification.type)) {
    new Notification(notification.title, {
      body: notification.message || undefined,
      icon: "/icons/notification-icon.png",
      tag: notification.id,
    })
  }
}
