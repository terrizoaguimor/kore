"use client"

import { useMemo } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isToday,
  setHours,
  getHours,
  getMinutes,
  differenceInMinutes,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/types/database"

interface CalendarWeekProps {
  selectedDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarWeek({
  selectedDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarWeekProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const hours = useMemo(() => {
    const start = setHours(new Date(), 0)
    return eachHourOfInterval({
      start,
      end: setHours(start, 23),
    })
  }, [])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return isSameDay(eventDate, day) && !event.all_day
    })
  }

  const getAllDayEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return isSameDay(eventDate, day) && event.all_day
    })
  }

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    const startMinutes = getHours(start) * 60 + getMinutes(start)
    const durationMinutes = differenceInMinutes(end, start)

    const top = (startMinutes / (24 * 60)) * 100
    const height = Math.max((durationMinutes / (24 * 60)) * 100, 2)

    return { top: `${top}%`, height: `${height}%` }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-[60px_1fr] border-b">
        <div className="border-r" />
        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex flex-col items-center py-2 border-r last:border-r-0",
                isToday(day) && "bg-primary/5"
              )}
            >
              <span className="text-xs text-muted-foreground">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All day events row */}
      <div className="grid grid-cols-[60px_1fr] border-b">
        <div className="flex items-center justify-center border-r px-2 text-xs text-muted-foreground">
          All day
        </div>
        <div className="grid min-h-[40px] grid-cols-7">
          {weekDays.map((day) => {
            const allDayEvents = getAllDayEventsForDay(day)
            return (
              <div
                key={day.toISOString()}
                className="border-r p-1 last:border-r-0"
              >
                {allDayEvents.map((event) => {
                  const calendar = (event as any).calendar
                  const color = calendar?.color || "#2f62ea"
                  return (
                    <button
                      key={event.id}
                      className="mb-1 w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-white"
                      style={{ backgroundColor: color }}
                      onClick={() => onEventClick(event)}
                    >
                      {event.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_1fr]" style={{ height: `${24 * 60}px` }}>
          {/* Time labels */}
          <div className="relative border-r">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: `${(getHours(hour) / 24) * 100}%` }}
              >
                {format(hour, "h a")}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="relative grid grid-cols-7">
            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="absolute left-0 right-0 border-t border-muted"
                style={{ top: `${(getHours(hour) / 24) * 100}%` }}
              />
            ))}

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative border-r last:border-r-0",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  {dayEvents.map((event) => {
                    const position = getEventPosition(event)
                    const calendar = (event as any).calendar
                    const color = calendar?.color || "#2f62ea"

                    return (
                      <button
                        key={event.id}
                        className="absolute left-1 right-1 overflow-hidden rounded px-1 text-left text-xs text-white"
                        style={{
                          ...position,
                          backgroundColor: color,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-[10px] opacity-90">
                          {format(new Date(event.start_time), "h:mm a")}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
