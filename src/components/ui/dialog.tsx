"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  defaultOpen?: boolean
}

function Dialog({ open: controlledOpen, onOpenChange, children, defaultOpen = false }: DialogProps) {
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
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function DialogTrigger({ children, asChild, onClick, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialogContext()

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

function DialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}

function DialogClose({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext()

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

interface DialogOverlayProps {
  className?: string
}

function DialogOverlay({ className }: DialogOverlayProps) {
  const { setOpen } = useDialogContext()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-md", className)}
      onClick={() => setOpen(false)}
    />
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function DialogContent({ children, className, showCloseButton = true }: DialogContentProps) {
  const { open, setOpen } = useDialogContext()

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

  return (
    <DialogPortal>
      <AnimatePresence>
        {open && (
          <>
            <DialogOverlay />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "-48%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: "-48%", x: "-50%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg gap-4 rounded-xl border border-border/50 bg-card p-6 shadow-2xl",
                "max-w-[calc(100%-2rem)]",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
              {showCloseButton && (
                <DialogClose
                  className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
