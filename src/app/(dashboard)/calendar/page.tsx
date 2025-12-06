"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid,
  List,
  CalendarDays,
  CalendarRange,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCalendar } from "@/hooks/use-calendar"
import { useAuthStore } from "@/stores/auth-store"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { CalendarWeek } from "@/components/calendar/calendar-week"
import { EventDialog } from "@/components/calendar/event-dialog"
import type { CalendarEvent } from "@/types/database"

export default function CalendarPage() {
  const { organization } = useAuthStore()
  const {
    calendars,
    events,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    isLoading,
    fetchCalendars,
    ensureDefaultCalendar,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar()

  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [clickedDate, setClickedDate] = useState<Date>(new Date())

  // Initialize calendars and fetch events
  useEffect(() => {
    if (organization) {
      ensureDefaultCalendar()
    }
  }, [organization, ensureDefaultCalendar])

  useEffect(() => {
    if (calendars.length > 0) {
      fetchEvents()
    }
  }, [calendars, selectedDate, view, fetchEvents])

  const handleDateClick = useCallback((date: Date) => {
    setClickedDate(date)
    setSelectedEvent(null)
    setEventDialogOpen(true)
  }, [])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setEventDialogOpen(true)
  }, [])

  const handleSaveEvent = useCallback(async (eventData: any) => {
    if (eventData.id) {
      return updateEvent(eventData)
    }
    return createEvent(eventData)
  }, [createEvent, updateEvent])

  const handleNewEvent = useCallback(() => {
    setClickedDate(selectedDate)
    setSelectedEvent(null)
    setEventDialogOpen(true)
  }, [selectedDate])

  const goToPrevious = useCallback(() => {
    switch (view) {
      case "month":
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
        break
      case "week":
        setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))
        break
      case "day":
        setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))
        break
    }
  }, [selectedDate, view, setSelectedDate])

  const goToNext = useCallback(() => {
    switch (view) {
      case "month":
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
        break
      case "week":
        setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))
        break
      case "day":
        setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))
        break
    }
  }, [selectedDate, view, setSelectedDate])

  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [setSelectedDate])

  const getViewTitle = () => {
    switch (view) {
      case "month":
        return format(selectedDate, "MMMM yyyy")
      case "week":
        return `Week of ${format(selectedDate, "MMM d, yyyy")}`
      case "day":
        return format(selectedDate, "EEEE, MMMM d, yyyy")
      default:
        return format(selectedDate, "MMMM yyyy")
    }
  }

  const viewIcons = {
    month: LayoutGrid,
    week: CalendarRange,
    day: CalendarDays,
    agenda: List,
  }

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{getViewTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {view === "month" && <LayoutGrid className="mr-2 h-4 w-4" />}
                {view === "week" && <CalendarRange className="mr-2 h-4 w-4" />}
                {view === "day" && <CalendarDays className="mr-2 h-4 w-4" />}
                {view === "agenda" && <List className="mr-2 h-4 w-4" />}
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setView("month")}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("week")}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("day")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Day
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button onClick={handleNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {view === "month" && (
              <CalendarGrid
                selectedDate={selectedDate}
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
            {view === "week" && (
              <CalendarWeek
                selectedDate={selectedDate}
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
            {view === "day" && (
              <CalendarWeek
                selectedDate={selectedDate}
                events={events.filter((e) => {
                  const eventDate = new Date(e.start_time)
                  return eventDate.toDateString() === selectedDate.toDateString()
                })}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
          </>
        )}
      </div>

      {/* Event Dialog */}
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        calendars={calendars}
        selectedDate={clickedDate}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
      />
    </div>
  )
}
