"use client"

import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/types/database"

interface CalendarGridProps {
  selectedDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarGrid({
  selectedDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [selectedDate])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return isSameDay(eventDate, day)
    })
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-1 flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, selectedDate)
          const isSelected = isSameDay(day, selectedDate)
          const isDayToday = isToday(day)

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[120px] border-b border-r p-1 transition-colors hover:bg-muted/50 cursor-pointer",
                !isCurrentMonth && "bg-muted/30",
                idx % 7 === 0 && "border-l"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className="flex items-center justify-between p-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    !isCurrentMonth && "text-muted-foreground",
                    isDayToday && "bg-primary text-primary-foreground",
                    isSelected && !isDayToday && "bg-muted ring-2 ring-primary"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events for this day */}
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const calendar = (event as any).calendar
                  const color = calendar?.color || "#2f62ea"

                  return (
                    <button
                      key={event.id}
                      className={cn(
                        "w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-white transition-opacity hover:opacity-90"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    >
                      {event.all_day ? (
                        event.title
                      ) : (
                        <>
                          {format(new Date(event.start_time), "h:mm a")} {event.title}
                        </>
                      )}
                    </button>
                  )
                })}
                {dayEvents.length > 3 && (
                  <button
                    className="w-full text-left text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDateClick(day)
                    }}
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
