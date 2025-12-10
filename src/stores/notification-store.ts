import { create } from "zustand"
import type { Notification } from "@/types/notifications"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isConnected: boolean

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setLoading: (loading: boolean) => void
  setConnected: (connected: boolean) => void
  reset: () => void
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  isConnected: false,
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.is_read).length
    set({ notifications, unreadCount, isLoading: false })
  },

  addNotification: (notification) => {
    set((state) => {
      // Check if notification already exists
      const exists = state.notifications.some((n) => n.id === notification.id)
      if (exists) return state

      const newNotifications = [notification, ...state.notifications]
      const unreadCount = newNotifications.filter((n) => !n.is_read).length
      return { notifications: newNotifications, unreadCount }
    })
  },

  updateNotification: (id, updates) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      )
      const unreadCount = notifications.filter((n) => !n.is_read).length
      return { notifications, unreadCount }
    })
  },

  removeNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id)
      const unreadCount = notifications.filter((n) => !n.is_read).length
      return { notifications, unreadCount }
    })
  },

  markAsRead: (id) => {
    const { updateNotification } = get()
    updateNotification(id, { is_read: true })
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  setLoading: (isLoading) => set({ isLoading }),

  setConnected: (isConnected) => set({ isConnected }),

  reset: () => set(initialState),
}))
