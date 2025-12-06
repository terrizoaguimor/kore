export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Json
          storage_quota: number
          storage_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          settings?: Json
          storage_quota?: number
          storage_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          settings?: Json
          storage_quota?: number
          storage_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          settings: Json
          last_activity_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          settings?: Json
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          settings?: Json
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: "owner" | "admin" | "member" | "guest"
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: "owner" | "admin" | "member" | "guest"
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: "owner" | "admin" | "member" | "guest"
          joined_at?: string
        }
      }
      files: {
        Row: {
          id: string
          organization_id: string
          parent_id: string | null
          owner_id: string | null
          name: string
          type: "file" | "folder"
          mime_type: string | null
          size: number
          storage_path: string | null
          thumbnail_path: string | null
          metadata: Json
          is_starred: boolean
          is_trashed: boolean
          trashed_at: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          parent_id?: string | null
          owner_id?: string | null
          name: string
          type: "file" | "folder"
          mime_type?: string | null
          size?: number
          storage_path?: string | null
          thumbnail_path?: string | null
          metadata?: Json
          is_starred?: boolean
          is_trashed?: boolean
          trashed_at?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          parent_id?: string | null
          owner_id?: string | null
          name?: string
          type?: "file" | "folder"
          mime_type?: string | null
          size?: number
          storage_path?: string | null
          thumbnail_path?: string | null
          metadata?: Json
          is_starred?: boolean
          is_trashed?: boolean
          trashed_at?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      file_versions: {
        Row: {
          id: string
          file_id: string
          version: number
          size: number
          storage_path: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          version: number
          size: number
          storage_path: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          version?: number
          size?: number
          storage_path?: string
          created_by?: string | null
          created_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          file_id: string
          shared_by: string | null
          shared_with_user: string | null
          shared_with_email: string | null
          token: string | null
          permission: "view" | "edit" | "upload"
          password_hash: string | null
          expires_at: string | null
          download_count: number
          max_downloads: number | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          shared_by?: string | null
          shared_with_user?: string | null
          shared_with_email?: string | null
          token?: string | null
          permission: "view" | "edit" | "upload"
          password_hash?: string | null
          expires_at?: string | null
          download_count?: number
          max_downloads?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          shared_by?: string | null
          shared_with_user?: string | null
          shared_with_email?: string | null
          token?: string | null
          permission?: "view" | "edit" | "upload"
          password_hash?: string | null
          expires_at?: string | null
          download_count?: number
          max_downloads?: number | null
          created_at?: string
        }
      }
      calendars: {
        Row: {
          id: string
          organization_id: string
          owner_id: string | null
          name: string
          color: string
          description: string | null
          is_default: boolean
          timezone: string
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          owner_id?: string | null
          name: string
          color?: string
          description?: string | null
          is_default?: boolean
          timezone?: string
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          owner_id?: string | null
          name?: string
          color?: string
          description?: string | null
          is_default?: boolean
          timezone?: string
          settings?: Json
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          calendar_id: string
          title: string
          description: string | null
          location: string | null
          start_time: string
          end_time: string
          all_day: boolean
          recurrence_rule: string | null
          recurrence_id: string | null
          status: "confirmed" | "tentative" | "cancelled"
          visibility: "default" | "public" | "private"
          busy_status: "free" | "busy" | "tentative"
          reminders: Json
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          calendar_id: string
          title: string
          description?: string | null
          location?: string | null
          start_time: string
          end_time: string
          all_day?: boolean
          recurrence_rule?: string | null
          recurrence_id?: string | null
          status?: "confirmed" | "tentative" | "cancelled"
          visibility?: "default" | "public" | "private"
          busy_status?: "free" | "busy" | "tentative"
          reminders?: Json
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          calendar_id?: string
          title?: string
          description?: string | null
          location?: string | null
          start_time?: string
          end_time?: string
          all_day?: boolean
          recurrence_rule?: string | null
          recurrence_id?: string | null
          status?: "confirmed" | "tentative" | "cancelled"
          visibility?: "default" | "public" | "private"
          busy_status?: "free" | "busy" | "tentative"
          reminders?: Json
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          contact_book_id: string
          prefix: string | null
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          nickname: string | null
          organization: string | null
          job_title: string | null
          birthday: string | null
          notes: string | null
          photo_url: string | null
          is_starred: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_book_id: string
          prefix?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          nickname?: string | null
          organization?: string | null
          job_title?: string | null
          birthday?: string | null
          notes?: string | null
          photo_url?: string | null
          is_starred?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_book_id?: string
          prefix?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          nickname?: string | null
          organization?: string | null
          job_title?: string | null
          birthday?: string | null
          notes?: string | null
          photo_url?: string | null
          is_starred?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          organization_id: string
          name: string | null
          type: "direct" | "group" | "public" | "channel"
          description: string | null
          avatar_url: string | null
          settings: Json
          last_message_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name?: string | null
          type: "direct" | "group" | "public" | "channel"
          description?: string | null
          avatar_url?: string | null
          settings?: Json
          last_message_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string | null
          type?: "direct" | "group" | "public" | "channel"
          description?: string | null
          avatar_url?: string | null
          settings?: Json
          last_message_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string | null
          content: string | null
          message_type: "text" | "file" | "image" | "video" | "audio" | "system"
          file_id: string | null
          reply_to_id: string | null
          reactions: Json
          is_edited: boolean
          is_deleted: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id?: string | null
          content?: string | null
          message_type?: "text" | "file" | "image" | "video" | "audio" | "system"
          file_id?: string | null
          reply_to_id?: string | null
          reactions?: Json
          is_edited?: boolean
          is_deleted?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string | null
          content?: string | null
          message_type?: "text" | "file" | "image" | "video" | "audio" | "system"
          file_id?: string | null
          reply_to_id?: string | null
          reactions?: Json
          is_edited?: boolean
          is_deleted?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          position: number
          priority: "low" | "medium" | "high" | "urgent"
          status: "todo" | "in_progress" | "done"
          due_date: string | null
          assigned_to: string | null
          created_by: string | null
          labels: Json
          attachments: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          position?: number
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "todo" | "in_progress" | "done"
          due_date?: string | null
          assigned_to?: string | null
          created_by?: string | null
          labels?: Json
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          position?: number
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "todo" | "in_progress" | "done"
          due_date?: string | null
          assigned_to?: string | null
          created_by?: string | null
          labels?: Json
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          organization_id: string
          owner_id: string | null
          title: string
          content: string | null
          is_pinned: boolean
          is_archived: boolean
          folder_id: string | null
          tags: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          owner_id?: string | null
          title: string
          content?: string | null
          is_pinned?: boolean
          is_archived?: boolean
          folder_id?: string | null
          tags?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          owner_id?: string | null
          title?: string
          content?: string | null
          is_pinned?: boolean
          is_archived?: boolean
          folder_id?: string | null
          tags?: Json
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link: string | null
          is_read: boolean
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Convenience types
export type Organization = Tables<"organizations">
export type User = Tables<"users">
export type OrganizationMember = Tables<"organization_members">
export type File = Tables<"files">
export type FileVersion = Tables<"file_versions">
export type Share = Tables<"shares">
export type Calendar = Tables<"calendars">
export type CalendarEvent = Tables<"calendar_events">
export type Contact = Tables<"contacts">
export type ChatRoom = Tables<"chat_rooms">
export type ChatMessage = Tables<"chat_messages">
export type Task = Tables<"tasks">
export type Note = Tables<"notes">
export type ActivityLog = Tables<"activity_logs">
export type Notification = Tables<"notifications">

// Contact related types (manual definitions since not in generated types)
export interface ContactBook {
  id: string
  organization_id: string
  owner_id: string
  name: string
  is_default: boolean
  created_at: string
}
export interface ContactEmail {
  id: string
  contact_id: string
  email: string
  type: string
  is_primary: boolean
}

export interface ContactPhone {
  id: string
  contact_id: string
  phone: string
  type: string
  is_primary: boolean
}

export interface ContactAddress {
  id: string
  contact_id: string
  street: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  type: string
}

// Chat related types
export interface ChatRoomParticipant {
  id: string
  room_id: string
  user_id: string
  role: "owner" | "moderator" | "member"
  last_read_at: string | null
  notifications_enabled: boolean
  joined_at: string
}

export interface Call {
  id: string
  room_id: string
  started_by: string | null
  type: "audio" | "video"
  status: "active" | "ended" | "missed"
  started_at: string
  ended_at: string | null
  recording_path: string | null
  metadata: Json
}

export interface CallParticipant {
  id: string
  call_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  is_muted: boolean
  is_video_off: boolean
}

// Task related types
export interface TaskBoard {
  id: string
  organization_id: string
  name: string
  color: string
  owner_id: string | null
  created_at: string
}

export interface TaskList {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
}
