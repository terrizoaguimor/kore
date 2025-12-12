"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    gradient?: string
  }
>(({ className, sideOffset = 6, gradient, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg bg-[#1b2d7c] border border-white/10 px-3 py-2 text-sm text-white shadow-xl",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {gradient && (
        <div
          className={cn(
            "absolute -inset-[1px] rounded-lg opacity-50 -z-10",
            `bg-gradient-to-r ${gradient}`
          )}
        />
      )}
      {children}
      <TooltipPrimitive.Arrow className="fill-[#1b2d7c]" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Helper component for quick tooltips with optional gradient
interface QuickTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  description?: string
  gradient?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  shortcut?: string
}

function QuickTooltip({
  children,
  content,
  description,
  gradient,
  side = "top",
  align = "center",
  delayDuration = 200,
  shortcut,
}: QuickTooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} gradient={gradient} className={gradient ? "relative" : ""}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{content}</span>
          {shortcut && (
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 text-[10px] font-medium text-[#A1A1AA]">
              {shortcut}
            </kbd>
          )}
        </div>
        {description && (
          <div className="text-xs text-[#A1A1AA] mt-0.5 max-w-[200px]">{description}</div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// Feature tooltip for onboarding/guides
interface FeatureTooltipProps {
  children: React.ReactNode
  title: string
  description: string
  gradient?: string
  side?: "top" | "right" | "bottom" | "left"
  icon?: React.ReactNode
}

function FeatureTooltip({
  children,
  title,
  description,
  gradient = "from-[#0046E2] to-[#1A5AE8]",
  side = "right",
  icon,
}: FeatureTooltipProps) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className="relative p-0 max-w-[280px] overflow-hidden"
      >
        {/* Gradient border */}
        <div className={cn("absolute inset-0 rounded-lg opacity-30 bg-gradient-to-br", gradient)} />

        {/* Content */}
        <div className="relative p-3 bg-[#1b2d7c] m-[1px] rounded-[7px]">
          <div className="flex items-start gap-3">
            {icon && (
              <div className={cn(
                "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                gradient
              )}>
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  QuickTooltip,
  FeatureTooltip,
}
