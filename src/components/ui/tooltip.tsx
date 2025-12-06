"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

// Context for tooltip state
interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextType | null>(null)

function useTooltipContext() {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip")
  }
  return context
}

// Provider component
interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

function TooltipProvider({ children, delayDuration = 0 }: TooltipProviderProps) {
  return <>{children}</>
}

// Root component
interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  delayDuration?: number
}

function Tooltip({ children, open: controlledOpen, onOpenChange, defaultOpen = false, delayDuration = 300 }: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  )
}

// Trigger component
interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

function TooltipTrigger({ children, asChild, ...props }: TooltipTriggerProps) {
  const { setOpen, triggerRef, delayDuration } = useTooltipContext()
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setOpen(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>
    return React.cloneElement(childElement, {
      ref: triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    })
  }

  return (
    <span
      ref={triggerRef as React.Ref<HTMLSpanElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </span>
  )
}

// Portal component
function TooltipPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Content component
interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  side?: "top" | "bottom" | "left" | "right"
}

function TooltipContent({ children, className, sideOffset = 4, side = "top" }: TooltipContentProps) {
  const { open, triggerRef } = useTooltipContext()
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (side) {
        case "top":
          top = rect.top - sideOffset
          left = rect.left + rect.width / 2
          break
        case "bottom":
          top = rect.bottom + sideOffset
          left = rect.left + rect.width / 2
          break
        case "left":
          top = rect.top + rect.height / 2
          left = rect.left - sideOffset
          break
        case "right":
          top = rect.top + rect.height / 2
          left = rect.right + sideOffset
          break
      }

      setPosition({ top, left })
    }
  }, [open, triggerRef, sideOffset, side])

  const transformStyle = side === "top" || side === "bottom"
    ? "translateX(-50%)"
    : "translateY(-50%)"

  const initialY = side === "top" ? 4 : side === "bottom" ? -4 : 0
  const initialX = side === "left" ? 4 : side === "right" ? -4 : 0

  return (
    <TooltipPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: initialY, x: initialX }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: side === "top" ? position.top : position.top,
              left: position.left,
              transform: transformStyle + (side === "top" ? " translateY(-100%)" : ""),
            }}
            className={cn(
              "z-50 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipPortal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
