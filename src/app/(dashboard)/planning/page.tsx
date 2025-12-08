'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Target,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PlanCard from '@/components/planning/PlanCard'
import ProgressBar from '@/components/planning/ProgressBar'
import { Plan, PlanningStats, AISuggestion } from '@/types/planning'

export default function PlanningDashboard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<PlanningStats>({
    totalPlans: 0,
    activePlans: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    tasksThisWeek: 0
  })
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchAISuggestions = async (planNames: string[]) => {
    setAiLoading(true)
    try {
      const currentMonth = new Date().toLocaleString('es', { month: 'long' })
      const response = await fetch('/api/planning/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggest',
          prompt: `Estamos en ${currentMonth}. Sugiere acciones importantes para este momento del ano.`,
          context: {
            existingTasks: planNames
          }
        })
      })

      const data = await response.json()
      if (data.success && data.data?.suggestions) {
        setAiSuggestions(data.data.suggestions.slice(0, 4))
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/planning/plans')
      const data = await response.json()

      if (data.success) {
        setPlans(data.data)

        // Calculate stats
        const activePlans = data.data.filter((p: Plan) => p.status === 'ACTIVE')
        const totalTasks = data.data.reduce((sum: number, p: Plan) => sum + p.taskCount, 0)
        const completedTasks = data.data.reduce((sum: number, p: Plan) => sum + p.completedTaskCount, 0)

        setStats({
          totalPlans: data.data.length,
          activePlans: activePlans.length,
          totalTasks,
          completedTasks,
          overdueTasks: 0,
          tasksThisWeek: 0
        })

        // Fetch AI suggestions
        const planNames = data.data.map((p: Plan) => p.name)
        fetchAISuggestions(planNames)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const activePlan = plans.find(p => p.year === currentYear && p.status === 'ACTIVE')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">KORE Planning</h1>
          <p className="text-[#A1A1AA] text-sm mt-1">
            Gestiona los planes de accion de tu equipo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button asChild size="sm">
            <Link href="/planning/plans">
              <FolderKanban className="w-4 h-4" />
              Ver Planes
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1F1F1F] rounded-xl p-4 border border-[#2A2A2A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00E5FF]/20 rounded-full flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalPlans}</p>
              <p className="text-sm text-[#A1A1AA]">Planes Totales</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1F1F1F] rounded-xl p-4 border border-[#2A2A2A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00D68F]/20 rounded-full flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#00D68F]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completedTasks}/{stats.totalTasks}</p>
              <p className="text-sm text-[#A1A1AA]">Tareas Completadas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1F1F1F] rounded-xl p-4 border border-[#2A2A2A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFB830]/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#FFB830]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activePlans}</p>
              <p className="text-sm text-[#A1A1AA]">Planes Activos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1F1F1F] rounded-xl p-4 border border-[#2A2A2A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00E5FF]/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </p>
              <p className="text-sm text-[#A1A1AA]">Progreso Global</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Year Plan Highlight */}
      {activePlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 rounded-2xl p-6 mb-8 border border-[#00E5FF]/20"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-[#00E5FF]" />
                <h2 className="text-xl font-bold text-white">Plan {currentYear}</h2>
                <Badge className="bg-[#00D68F] text-white border-0">Activo</Badge>
              </div>
              <p className="text-[#A1A1AA] mb-4">
                {activePlan.description || `Plan para ${currentYear}`}
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-[#A1A1AA]">Tareas</p>
                  <p className="text-lg font-bold text-white">{activePlan.completedTaskCount}/{activePlan.taskCount}</p>
                </div>
                <div className="flex-1 max-w-xs">
                  <p className="text-sm text-[#A1A1AA] mb-1">Progreso</p>
                  <ProgressBar progress={activePlan.overallProgress} size="md" />
                </div>
              </div>
            </div>
            <Button asChild>
              <Link href={`/planning/plans/${activePlan.id}`}>
                Ver Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* AI Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-2xl p-6 mb-8 border border-violet-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Sugerencias de IA</h2>
            <p className="text-sm text-[#A1A1AA]">Recomendaciones basadas en tu contexto</p>
          </div>
          {aiLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-violet-500 ml-auto" />
          )}
        </div>

        {aiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#0B0B0B]/50 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-[#2A2A2A] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#2A2A2A] rounded w-full mb-1"></div>
                <div className="h-3 bg-[#2A2A2A] rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : aiSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSuggestions.map((suggestion, index) => {
              const typeConfig = {
                task: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                improvement: { icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                opportunity: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' }
              }
              const config = typeConfig[suggestion.type] || typeConfig.task
              const Icon = config.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-[#0B0B0B]/80 rounded-xl p-4 hover:bg-[#0B0B0B] transition-colors border border-[#2A2A2A]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1 line-clamp-1 text-white">{suggestion.title}</h3>
                      <p className="text-xs text-[#A1A1AA] line-clamp-2">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.priority === 'URGENT' ? 'bg-[#FF4757]/20 text-[#FF4757]' :
                          suggestion.priority === 'HIGH' ? 'bg-[#FFB830]/20 text-[#FFB830]' :
                          suggestion.priority === 'MEDIUM' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-[#2A2A2A] text-[#A1A1AA]'
                        }`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#A1A1AA]">{suggestion.category}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-[#A1A1AA]">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Las sugerencias se cargan automaticamente</p>
          </div>
        )}
      </motion.div>

      {/* Recent Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Planes Recientes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/planning/plans">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF]" />
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-[#1F1F1F] rounded-xl p-12 text-center border border-[#2A2A2A]">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-[#A1A1AA]/30" />
            <h3 className="text-lg font-medium mb-2 text-white">No hay planes creados</h3>
            <p className="text-[#A1A1AA] mb-4">
              Crea tu primer plan de accion para comenzar a organizar las tareas
            </p>
            <Button asChild>
              <Link href="/planning/plans">
                <Plus className="w-4 h-4" />
                Crear Plan
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.slice(0, 6).map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
