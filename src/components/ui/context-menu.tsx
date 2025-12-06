"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Context for context menu state
interface ContextMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
  position: { x: number; y: number }
  setPosition: (position: { x: number; y: number }) => void
}

const ContextMenuContext = React.createContext<ContextMenuContextType | null>(null)

function useContextMenuContext() {
  const context = React.useContext(ContextMenuContext)
  if (!context) {
    throw new Error("ContextMenu components must be used within a ContextMenu")
  }
  return context
}

// Root component
interface ContextMenuProps {
  children: React.ReactNode
}

function ContextMenu({ children }: ContextMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  return (
    <ContextMenuContext.Provider value={{ open, setOpen, position, setPosition }}>
      {children}
    </ContextMenuContext.Provider>
  )
}

// Trigger component
interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

function ContextMenuTrigger({ children, asChild, onContextMenu, ...props }: ContextMenuTriggerProps) {
  const { setOpen, setPosition } = useContextMenuContext()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpen(true)
    onContextMenu?.(e as React.MouseEvent<HTMLDivElement>)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onContextMenu: handleContextMenu,
    })
  }

  return (
    <div onContextMenu={handleContextMenu} {...props}>
      {children}
    </div>
  )
}

// Portal component
function ContextMenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Group component
function ContextMenuGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={className} {...props}>
      {children}
    </div>
  )
}

// Sub component (simplified)
function ContextMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Radio Group context
interface RadioGroupContextType {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

interface ContextMenuRadioGroupProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
}

function ContextMenuRadioGroup({ children, value, onValueChange }: ContextMenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

// Content component
interface ContextMenuContentProps {
  children: React.ReactNode
  className?: string
}

function ContextMenuContent({ children, className }: ContextMenuContentProps) {
  const { open, setOpen, position } = useContextMenuContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, setOpen])

  return (
    <ContextMenuPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "fixed",
              top: position.y,
              left: position.x,
            }}
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ContextMenuPortal>
  )
}

// Item component
interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
  variant?: "default" | "destructive"
}

function ContextMenuItem({ className, inset, variant = "default", onClick, children, disabled, ...props }: ContextMenuItemProps) {
  const { setOpen } = useContextMenuContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(e)
    setOpen(false)
  }

  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Checkbox Item component
interface ContextMenuCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: ContextMenuCheckboxItemProps) {
  const handleClick = () => {
    onCheckedChange?.(!checked)
  }

  return (
    <button
      role="menuitemcheckbox"
      type="button"
      aria-checked={checked}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </button>
  )
}

// Radio Item component
interface ContextMenuRadioItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function ContextMenuRadioItem({ className, children, value, ...props }: ContextMenuRadioItemProps) {
  const context = React.useContext(RadioGroupContext)
  const checked = context?.value === value

  const handleClick = () => {
    context?.onValueChange(value)
  }

  return (
    <button
      role="menuitemradio"
      type="button"
      aria-checked={checked}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CircleIcon className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </button>
  )
}

// Label component
interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps) {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
      {...props}
    />
  )
}

// Separator component
function ContextMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// Shortcut component
function ContextMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

// Sub trigger (simplified)
function ContextMenuSubTrigger({ className, children, inset, ...props }: ContextMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </button>
  )
}

// Sub content (simplified)
function ContextMenuSubContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
