// ============================================
// KORE PLANNING TYPES
// ============================================

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type TaskCategory = 'CAMPAIGN' | 'CONTENT' | 'SOCIAL' | 'EVENT' | 'MEETING' | 'ADMIN' | 'OTHER'
export type ActionPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface Task {
  id: string
  title: string
  description?: string | null
  notes?: string | null
  priority: TaskPriority
  status: TaskStatus
  category: TaskCategory
  startDate?: string | null
  dueDate?: string | null
  progress: number
  assignedToId?: string | null
  assignedTo?: { id: string; name: string; email?: string } | null
  actionPlanId?: string | null
  actionPlan?: { id: string; name: string; year: number } | null
  parentTaskId?: string | null
  subtasks?: Task[]
  dependsOn?: Array<{
    blockingTask: { id: string; title: string; status: TaskStatus }
  }>
  _count?: { subtasks: number }
  createdAt?: string
  updatedAt?: string
}

export interface Plan {
  id: string
  name: string
  description?: string | null
  year: number
  status: ActionPlanStatus
  startDate?: string | null
  endDate?: string | null
  taskCount: number
  completedTaskCount: number
  overallProgress: number
  organizationId?: string
  createdBy: { id?: string; name: string; email?: string }
  tasks?: Task[]
  createdAt?: string
  updatedAt?: string
}

export interface AITask {
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  startDate?: string | null
  dueDate?: string | null
  subtasks?: Array<{ title: string; description: string }>
}

export interface AIPlan {
  name: string
  description: string
  year: number
  objectives?: string[]
  tasks: AITask[]
}

export interface AISuggestion {
  type: 'task' | 'improvement' | 'warning' | 'opportunity'
  title: string
  description: string
  priority: TaskPriority
  category: TaskCategory
  actionable: boolean
}

export interface PlanningStats {
  totalPlans: number
  activePlans: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  tasksThisWeek: number
}
