"use client"

import { useState, useEffect } from "react"
import { format, addHours, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { CalendarEvent, Calendar as CalendarType } from "@/types/database"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  calendars: CalendarType[]
  selectedDate?: Date
  onSave: (eventData: any) => Promise<any>
  onDelete?: (eventId: string) => Promise<void>
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  calendars,
  selectedDate = new Date(),
  onSave,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [allDay, setAllDay] = useState(false)
  const [startDate, setStartDate] = useState<Date>(selectedDate)
  const [startTime, setStartTime] = useState("09:00")
  const [endDate, setEndDate] = useState<Date>(selectedDate)
  const [endTime, setEndTime] = useState("10:00")
  const [calendarId, setCalendarId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setLocation(event.location || "")
      setAllDay(event.all_day || false)
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      setStartDate(start)
      setStartTime(format(start, "HH:mm"))
      setEndDate(end)
      setEndTime(format(end, "HH:mm"))
      setCalendarId(event.calendar_id)
    } else {
      setTitle("")
      setDescription("")
      setLocation("")
      setAllDay(false)
      setStartDate(selectedDate)
      setStartTime("09:00")
      setEndDate(selectedDate)
      setEndTime("10:00")
      setCalendarId(calendars[0]?.id || "")
    }
  }, [event, selectedDate, calendars, open])

  const handleSave = async () => {
    if (!title.trim() || !calendarId) return

    setIsSaving(true)
    try {
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      const [endHours, endMinutes] = endTime.split(":").map(Number)

      let start = new Date(startDate)
      let end = new Date(endDate)

      if (!allDay) {
        start = setMinutes(setHours(start, startHours), startMinutes)
        end = setMinutes(setHours(end, endHours), endMinutes)
      } else {
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      }

      const eventData = {
        ...(event ? { id: event.id } : {}),
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        all_day: allDay,
        start_time: start,
        end_time: end,
        calendar_id: calendarId,
      }

      await onSave(eventData)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !onDelete) return
    await onDelete(event.id)
    onOpenChange(false)
  }

  const timeOptions = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      timeOptions.push(time)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Input
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          {/* Calendar selection */}
          <div className="space-y-2">
            <Label>Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger>
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cal.color || "#2f62ea" }}
                      />
                      {cal.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day">All day</Label>
            <Switch
              id="all-day"
              checked={allDay}
              onCheckedChange={setAllDay}
            />
          </div>

          {/* Start date/time */}
          <div className="space-y-2">
            <Label>Start</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                  />
                </PopoverContent>
              </Popover>
              {!allDay && (
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="w-[120px]">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {format(setMinutes(setHours(new Date(), parseInt(time.split(":")[0])), parseInt(time.split(":")[1])), "h:mm a")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* End date/time */}
          <div className="space-y-2">
            <Label>End</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                  />
                </PopoverContent>
              </Popover>
              {!allDay && (
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="w-[120px]">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {format(setMinutes(setHours(new Date(), parseInt(time.split(":")[0])), parseInt(time.split(":")[1])), "h:mm a")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {event && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
