import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ModuleActivity, CommandModule } from "@/types/command"

interface DashboardStore {
  modules: ModuleActivity[]
  lastUpdated: Date | null

  // Actions
  updateModuleActivity: (module: CommandModule, updates: Partial<ModuleActivity>) => void
  setModulePriority: (module: CommandModule, priority: number) => void
  toggleModuleExpanded: (module: CommandModule) => void
  resetModules: () => void
  calculatePriorities: () => void
}

const defaultModules: ModuleActivity[] = [
  {
    module: "files",
    priority: 50,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "calendar",
    priority: 50,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "contacts",
    priority: 30,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: false,
  },
  {
    module: "talk",
    priority: 60,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "tasks",
    priority: 70,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "notes",
    priority: 20,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: false,
  },
  {
    module: "crm",
    priority: 65,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "pulse",
    priority: 55,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
  {
    module: "voice",
    priority: 75,
    hasUrgent: false,
    unreadCount: 0,
    pendingTasks: 0,
    lastActivity: null,
    isExpanded: true,
  },
]

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      modules: defaultModules,
      lastUpdated: null,

      updateModuleActivity: (module, updates) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.module === module ? { ...m, ...updates, lastActivity: new Date() } : m
          ),
          lastUpdated: new Date(),
        }))
        // Recalculate priorities after update
        get().calculatePriorities()
      },

      setModulePriority: (module, priority) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.module === module ? { ...m, priority: Math.min(100, Math.max(0, priority)) } : m
          ),
        }))
      },

      toggleModuleExpanded: (module) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.module === module ? { ...m, isExpanded: !m.isExpanded } : m
          ),
        }))
      },

      resetModules: () => {
        set({ modules: defaultModules, lastUpdated: null })
      },

      calculatePriorities: () => {
        set((state) => {
          const now = new Date()
          const modules = state.modules.map((m) => {
            let priority = 30 // Base priority

            // Urgent items add significant priority
            if (m.hasUrgent) {
              priority += 40
            }

            // Unread items add priority
            if (m.unreadCount > 0) {
              priority += Math.min(m.unreadCount * 5, 25)
            }

            // Pending tasks add priority
            if (m.pendingTasks > 0) {
              priority += Math.min(m.pendingTasks * 3, 15)
            }

            // Recent activity adds priority (within last hour)
            if (m.lastActivity) {
              const hoursSinceActivity = (now.getTime() - new Date(m.lastActivity).getTime()) / (1000 * 60 * 60)
              if (hoursSinceActivity < 1) {
                priority += 15
              } else if (hoursSinceActivity < 4) {
                priority += 10
              } else if (hoursSinceActivity < 24) {
                priority += 5
              }
            }

            // Auto-expand/collapse based on priority
            const shouldExpand = priority >= 50 || m.hasUrgent || m.unreadCount > 0

            return {
              ...m,
              priority: Math.min(100, Math.max(0, priority)),
              isExpanded: shouldExpand,
            }
          })

          return { modules, lastUpdated: now }
        })
      },
    }),
    {
      name: "kore-dashboard-store",
      partialize: (state) => ({
        modules: state.modules.map((m) => ({
          module: m.module,
          isExpanded: m.isExpanded,
        })),
      }),
    }
  )
)

// Utility function to get sorted modules by priority
export function getSortedModules(modules: ModuleActivity[]): ModuleActivity[] {
  return [...modules].sort((a, b) => b.priority - a.priority)
}

// Utility function to get expanded modules only
export function getExpandedModules(modules: ModuleActivity[]): ModuleActivity[] {
  return modules.filter((m) => m.isExpanded)
}

// Utility function to get modules with activity
export function getActiveModules(modules: ModuleActivity[]): ModuleActivity[] {
  return modules.filter((m) => m.hasUrgent || m.unreadCount > 0 || m.pendingTasks > 0)
}
