"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import type { Calendar, CalendarEvent } from "@/types/database"
import { toast } from "sonner"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"

interface UseCalendarOptions {
  calendarId?: string
}

interface CreateEventData {
  title: string
  description?: string
  location?: string
  start_time: Date
  end_time: Date
  all_day?: boolean
  calendar_id: string
  recurrence_rule?: string
  reminders?: any[]
}

interface UpdateEventData extends Partial<CreateEventData> {
  id: string
}

// Helper to get untyped supabase client for database operations
const getDb = (supabase: ReturnType<typeof createClient>) => {
  return supabase as any
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const { organization, user } = useAuthStore()
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()
  const db = getDb(supabase)

  // Fetch all calendars for the organization
  const fetchCalendars = useCallback(async () => {
    if (!organization) return

    try {
      const { data, error } = await db
        .from("calendars")
        .select("*")
        .eq("organization_id", organization.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true })

      if (error) throw error
      setCalendars(data || [])
      return data
    } catch (error) {
      console.error("Error fetching calendars:", error)
      toast.error("Failed to load calendars")
      return []
    }
  }, [organization, db])

  // Create default calendar if none exists
  const ensureDefaultCalendar = useCallback(async () => {
    if (!organization || !user) return null

    const cals = await fetchCalendars()
    if (cals && cals.length > 0) return cals[0]

    try {
      const { data, error } = await db
        .from("calendars")
        .insert({
          organization_id: organization.id,
          owner_id: user.id,
          name: "Personal",
          color: "#2f62ea",
          is_default: true,
        })
        .select()
        .single()

      if (error) throw error
      setCalendars([data])
      return data
    } catch (error) {
      console.error("Error creating default calendar:", error)
      return null
    }
  }, [organization, user, db, fetchCalendars])

  // Fetch events for the current view range
  const fetchEvents = useCallback(async () => {
    if (!organization) return

    setIsLoading(true)
    try {
      let rangeStart: Date
      let rangeEnd: Date

      switch (view) {
        case "month":
          rangeStart = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 })
          rangeEnd = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 })
          break
        case "week":
          rangeStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
          rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })
          break
        case "day":
          rangeStart = new Date(selectedDate)
          rangeStart.setHours(0, 0, 0, 0)
          rangeEnd = new Date(selectedDate)
          rangeEnd.setHours(23, 59, 59, 999)
          break
        case "agenda":
          rangeStart = new Date()
          rangeStart.setHours(0, 0, 0, 0)
          rangeEnd = addMonths(rangeStart, 1)
          break
      }

      const { data, error } = await db
        .from("calendar_events")
        .select(`
          *,
          calendar:calendars(*)
        `)
        .gte("start_time", rangeStart.toISOString())
        .lte("start_time", rangeEnd.toISOString())
        .in("calendar_id", calendars.map((c) => c.id))
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setIsLoading(false)
    }
  }, [organization, calendars, selectedDate, view, db])

  // Create a new event
  const createEvent = useCallback(async (eventData: CreateEventData) => {
    if (!user) return null

    try {
      const { data, error } = await db
        .from("calendar_events")
        .insert({
          ...eventData,
          start_time: eventData.start_time.toISOString(),
          end_time: eventData.end_time.toISOString(),
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setEvents((prev) => [...prev, data].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ))
      toast.success("Event created")
      return data
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event")
      return null
    }
  }, [user, db])

  // Update an event
  const updateEvent = useCallback(async (eventData: UpdateEventData) => {
    try {
      const updatePayload: any = { ...eventData }
      delete updatePayload.id

      if (eventData.start_time) {
        updatePayload.start_time = eventData.start_time.toISOString()
      }
      if (eventData.end_time) {
        updatePayload.end_time = eventData.end_time.toISOString()
      }

      const { data, error } = await db
        .from("calendar_events")
        .update(updatePayload)
        .eq("id", eventData.id)
        .select()
        .single()

      if (error) throw error

      setEvents((prev) =>
        prev.map((e) => e.id === eventData.id ? data : e)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      )
      toast.success("Event updated")
      return data
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Failed to update event")
      return null
    }
  }, [db])

  // Delete an event
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await db
        .from("calendar_events")
        .update({ status: "cancelled" })
        .eq("id", eventId)

      if (error) throw error

      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      toast.success("Event deleted")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    }
  }, [db])

  // Create a new calendar
  const createCalendar = useCallback(async (name: string, color: string = "#2f62ea") => {
    if (!organization || !user) return null

    try {
      const { data, error } = await db
        .from("calendars")
        .insert({
          organization_id: organization.id,
          owner_id: user.id,
          name,
          color,
          is_default: false,
        })
        .select()
        .single()

      if (error) throw error

      setCalendars((prev) => [...prev, data])
      toast.success(`Calendar "${name}" created`)
      return data
    } catch (error) {
      console.error("Error creating calendar:", error)
      toast.error("Failed to create calendar")
      return null
    }
  }, [organization, user, db])

  // Delete a calendar
  const deleteCalendar = useCallback(async (calendarId: string) => {
    try {
      const { error } = await db
        .from("calendars")
        .delete()
        .eq("id", calendarId)

      if (error) throw error

      setCalendars((prev) => prev.filter((c) => c.id !== calendarId))
      toast.success("Calendar deleted")
    } catch (error) {
      console.error("Error deleting calendar:", error)
      toast.error("Failed to delete calendar")
    }
  }, [db])

  // Navigation helpers
  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const goToPrevious = useCallback(() => {
    switch (view) {
      case "month":
        setSelectedDate((prev) => subMonths(prev, 1))
        break
      case "week":
        setSelectedDate((prev) => subWeeks(prev, 1))
        break
      case "day":
        setSelectedDate((prev) => subDays(prev, 1))
        break
    }
  }, [view])

  const goToNext = useCallback(() => {
    switch (view) {
      case "month":
        setSelectedDate((prev) => addMonths(prev, 1))
        break
      case "week":
        setSelectedDate((prev) => addWeeks(prev, 1))
        break
      case "day":
        setSelectedDate((prev) => addDays(prev, 1))
        break
    }
  }, [view])

  return {
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
    createCalendar,
    deleteCalendar,
    goToToday,
    goToPrevious,
    goToNext,
  }
}
