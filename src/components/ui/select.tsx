"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Context for select state
interface SelectContextType {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  displayValue: React.ReactNode
  setDisplayValue: (value: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

// Root component
interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function Select({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [displayValue, setDisplayValue] = React.useState<React.ReactNode>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const isValueControlled = controlledValue !== undefined
  const isOpenControlled = controlledOpen !== undefined

  const value = isValueControlled ? controlledValue : uncontrolledValue
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isValueControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isValueControlled, onValueChange])

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isOpenControlled) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isOpenControlled, onOpenChange])

  return (
    <SelectContext.Provider value={{ open, setOpen, value, onValueChange: handleValueChange, triggerRef, displayValue, setDisplayValue }}>
      {children}
    </SelectContext.Provider>
  )
}

// Group component
function SelectGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={className} {...props}>
      {children}
    </div>
  )
}

// Value component (displays selected value)
interface SelectValueProps {
  placeholder?: string
  className?: string
}

function SelectValue({ placeholder, className }: SelectValueProps) {
  const { displayValue, value } = useSelectContext()

  return (
    <span className={cn("pointer-events-none block truncate", className)}>
      {displayValue || (value ? value : <span className="text-muted-foreground">{placeholder}</span>)}
    </span>
  )
}

// Trigger component
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default"
}

function SelectTrigger({ className, size = "default", children, ...props }: SelectTriggerProps) {
  const { open, setOpen, triggerRef } = useSelectContext()

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" && "h-9",
        size === "sm" && "h-8",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  )
}

// Portal component
function SelectPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Content component
interface SelectContentProps {
  children: React.ReactNode
  className?: string
  position?: "popper" | "item-aligned"
  align?: "start" | "center" | "end"
}

function SelectContent({ children, className, position = "popper", align = "start" }: SelectContentProps) {
  const { open, setOpen, triggerRef } = useSelectContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [positionStyle, setPositionStyle] = React.useState({ top: 0, left: 0, width: 0 })

  // Calculate position
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPositionStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [open, triggerRef])

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
    <SelectPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: positionStyle.top,
              left: positionStyle.left,
              minWidth: positionStyle.width,
            }}
            className={cn(
              "z-50 max-h-96 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              className
            )}
            role="listbox"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </SelectPortal>
  )
}

// Label component
function SelectLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

// Item component
interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function SelectItem({ className, children, value, disabled, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen, setDisplayValue } = useSelectContext()
  const isSelected = selectedValue === value

  const handleClick = () => {
    if (disabled) return
    onValueChange(value)
    setDisplayValue(children)
    setOpen(false)
  }

  // Set display value when selected on mount
  React.useEffect(() => {
    if (isSelected) {
      setDisplayValue(children)
    }
  }, [isSelected, children, setDisplayValue])

  return (
    <button
      role="option"
      type="button"
      aria-selected={isSelected}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </button>
  )
}

// Separator component
function SelectSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// Scroll buttons (simplified, just for visual compatibility)
function SelectScrollUpButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4" />
    </div>
  )
}

function SelectScrollDownButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </div>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
