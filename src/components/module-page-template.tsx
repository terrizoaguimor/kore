"use client"

import { motion } from "motion/react"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ModulePageTemplateProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  backHref: string
  backLabel: string
  children?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function ModulePageTemplate({
  title,
  description,
  icon: Icon,
  iconColor,
  backHref,
  backLabel,
  children,
  actionLabel,
  onAction,
}: ModulePageTemplateProps) {
  // Map color to tailwind class for icons
  const getIconColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      "#FF4757": "text-[#FF4757]",
      "#00E5FF": "text-[#00E5FF]",
      "#00D68F": "text-[#00D68F]",
      "#FFB830": "text-[#FFB830]",
    }
    return colorMap[color] || "text-[#00E5FF]"
  }

  const getBgColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      "#FF4757": "bg-[#FF4757]/20",
      "#00E5FF": "bg-[#00E5FF]/20",
      "#00D68F": "bg-[#00D68F]/20",
      "#FFB830": "bg-[#FFB830]/20",
    }
    return colorMap[color] || "bg-[#00E5FF]/20"
  }

  const getBtnColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      "#FF4757": "bg-[#FF4757] hover:bg-[#FF4757]/90",
      "#00E5FF": "bg-[#00E5FF] hover:bg-[#00E5FF]/90",
      "#00D68F": "bg-[#00D68F] hover:bg-[#00D68F]/90",
      "#FFB830": "bg-[#FFB830] hover:bg-[#FFB830]/90",
    }
    return colorMap[color] || "bg-[#00E5FF] hover:bg-[#00E5FF]/90"
  }

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Back Link */}
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", getBgColorClass(iconColor))}>
              <Icon className={cn("h-5 w-5", getIconColorClass(iconColor))} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm text-[#A1A1AA]">{description}</p>
            </div>
          </div>
        </motion.div>
        {actionLabel && (
          <button
            onClick={onAction}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors", getBtnColorClass(iconColor))}
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children || (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-12 text-center">
            <div className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-xl", getBgColorClass(iconColor))}>
              <Icon className={cn("h-8 w-8", getIconColorClass(iconColor))} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 max-w-md text-[#A1A1AA]">
              This section is coming soon. We&apos;re working on bringing you powerful tools for {title.toLowerCase()}.
            </p>
            {actionLabel && (
              <button
                onClick={onAction}
                className={cn("mt-6 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors", getBtnColorClass(iconColor))}
              >
                <Plus className="h-4 w-4" />
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
