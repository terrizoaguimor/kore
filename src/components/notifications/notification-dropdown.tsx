"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ListTodo,
  CheckCircle2,
  UserPlus,
  Clock,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  MessageCircle,
  MessageSquare,
  Share2,
  CalendarClock,
  Video,
  Calendar,
  UserMinus,
  Info,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/useNotifications"
import type { Notification, NotificationType } from "@/types/notifications"
import { NOTIFICATION_CONFIG } from "@/types/notifications"
import { cn } from "@/lib/utils"

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ListTodo,
  CheckCircle2,
  UserPlus,
  Clock,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  MessageCircle,
  MessageSquare,
  Share2,
  CalendarClock,
  Video,
  Calendar,
  UserMinus,
  Info,
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const config = NOTIFICATION_CONFIG[type]
  const IconComponent = iconMap[config.icon] || Info

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
      style={{ backgroundColor: `${config.color}15` }}
    >
      <span style={{ color: config.color }}>
        <IconComponent className="w-4 h-4" />
      </span>
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (notification: Notification) => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer",
        !notification.is_read && "bg-[#00E5FF]/5"
      )}
      onClick={() => onClick(notification)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
      )}

      <NotificationIcon type={notification.type} />

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          notification.is_read ? "text-[#A1A1AA]" : "text-white font-medium"
        )}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-[#A1A1AA]/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2">
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-[#A1A1AA] hover:text-[#00E5FF] transition-colors"
              title="Marcar como leída"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#A1A1AA] hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export function NotificationDropdown() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-[#A1A1AA] hover:text-white transition-all rounded-lg hover:bg-white/5 group focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30"
        >
          <span className="sr-only">Ver notificaciones</span>
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" />

          {/* Badge with unread count */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#00E5FF] text-[10px] font-bold text-black px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Connection indicator */}
          {!isConnected && !isLoading && (
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-yellow-500" title="Desconectado" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-white/10 text-white rounded-xl shadow-2xl shadow-black/50"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-medium">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="flex items-center gap-1 text-xs">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-[#10B981]" />
              ) : (
                <WifiOff className="w-3 h-3 text-yellow-500" />
              )}
            </div>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs text-[#A1A1AA] hover:text-[#00E5FF] hover:bg-white/5"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-[#A1A1AA]" />
              </div>
              <p className="text-sm text-[#A1A1AA] text-center">
                No tienes notificaciones
              </p>
              <p className="text-xs text-[#A1A1AA]/60 text-center mt-1">
                Las notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs text-[#A1A1AA] hover:text-[#00E5FF] hover:bg-white/5"
              onClick={() => router.push("/settings/notifications")}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
