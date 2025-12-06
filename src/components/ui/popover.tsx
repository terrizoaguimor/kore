"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

// Context for popover state
interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const PopoverContext = React.createContext<PopoverContextType | null>(null)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within a Popover")
  }
  return context
}

// Root component
interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function Popover({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

// Trigger component
interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function PopoverTrigger({ children, asChild, className, onClick, ...props }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopoverContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>
    return React.cloneElement(childElement, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        childElement.props.onClick?.(e)
        setOpen(!open)
      },
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Anchor component
function PopoverAnchor({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// Portal component
function PopoverPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Content component
interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  align?: "start" | "center" | "end"
}

function PopoverContent({ children, className, sideOffset = 4, align = "center" }: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopoverContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Calculate position
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const contentWidth = 288 // w-72 = 18rem = 288px

      let left = rect.left
      if (align === "center") {
        left = rect.left + rect.width / 2 - contentWidth / 2
      } else if (align === "end") {
        left = rect.right - contentWidth
      }

      // Ensure it doesn't go off-screen
      left = Math.max(8, Math.min(left, window.innerWidth - contentWidth - 8))

      setPosition({
        top: rect.bottom + sideOffset,
        left,
      })
    }
  }, [open, triggerRef, sideOffset, align])

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, setOpen, triggerRef])

  return (
    <PopoverPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className={cn(
              "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </PopoverPortal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
