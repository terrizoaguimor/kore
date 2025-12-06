"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Context for sheet state
interface SheetContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet")
  }
  return context
}

// Root component
interface SheetProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function Sheet({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

// Trigger component
interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function SheetTrigger({ children, asChild, onClick, ...props }: SheetTriggerProps) {
  const { setOpen } = useSheetContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.onClick?.(e)
        setOpen(true)
      },
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Close component
function SheetClose({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheetContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <button type="button" className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Portal component
function SheetPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Overlay component
function SheetOverlay({ className }: { className?: string }) {
  const { setOpen } = useSheetContext()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      onClick={() => setOpen(false)}
    />
  )
}

// Content component
interface SheetContentProps {
  children: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
}

function SheetContent({ children, className, side = "right" }: SheetContentProps) {
  const { open, setOpen } = useSheetContext()

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, setOpen])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const slideVariants = {
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    top: {
      initial: { y: "-100%" },
      animate: { y: 0 },
      exit: { y: "-100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
  }

  const positionClasses = {
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    top: "inset-x-0 top-0 h-auto border-b",
    bottom: "inset-x-0 bottom-0 h-auto border-t",
  }

  return (
    <SheetPortal>
      <AnimatePresence>
        {open && (
          <>
            <SheetOverlay />
            <motion.div
              initial={slideVariants[side].initial}
              animate={slideVariants[side].animate}
              exit={slideVariants[side].exit}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed z-50 flex flex-col gap-4 bg-background shadow-lg",
                positionClasses[side],
                className
              )}
            >
              {children}
              <SheetClose
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SheetPortal>
  )
}

// Header component
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

// Footer component
function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

// Title component
function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

// Description component
function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
