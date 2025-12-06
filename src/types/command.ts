// Command Palette Types

export type CommandCategory =
  | 'navigation'
  | 'action'
  | 'search'
  | 'ai'
  | 'quick'

export type CommandModule =
  | 'files'
  | 'calendar'
  | 'contacts'
  | 'talk'
  | 'tasks'
  | 'notes'
  | 'crm'
  | 'pulse'
  | 'voice'
  | 'settings'
  | 'global'

export interface Command {
  id: string
  label: string
  description?: string
  icon?: string
  category: CommandCategory
  module: CommandModule
  keywords?: string[]
  shortcut?: string
  action: () => void | Promise<void>
  isAI?: boolean
}

export interface CommandGroup {
  label: string
  commands: Command[]
}

export interface AICommand {
  intent: string
  entities: {
    module?: CommandModule
    action?: string
    target?: string
    date?: string
    time?: string
    recipient?: string
    content?: string
  }
  confidence: number
  suggestedActions: Command[]
}

export interface CommandPaletteState {
  isOpen: boolean
  query: string
  selectedIndex: number
  isLoading: boolean
  aiMode: boolean
  recentCommands: Command[]
}

export interface ModuleActivity {
  module: CommandModule
  priority: number // 0-100
  hasUrgent: boolean
  unreadCount: number
  pendingTasks: number
  lastActivity: Date | null
  isExpanded: boolean
}

export interface DashboardState {
  modules: ModuleActivity[]
  lastUpdated: Date
}
