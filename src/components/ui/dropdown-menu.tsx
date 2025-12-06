"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Context for dropdown menu state
interface DropdownMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null)

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu")
  }
  return context
}

// Root component
interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function DropdownMenu({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: DropdownMenuProps) {
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
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

// Portal component
function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// Trigger component
interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function DropdownMenuTrigger({ children, asChild, className, onClick, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext()

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
      "aria-expanded": open,
      "aria-haspopup": "menu",
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  )
}

// Content component
interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  align?: "start" | "center" | "end"
}

function DropdownMenuContent({ children, className, sideOffset = 4, align = "end", onClick }: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Calculate position
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      let left = rect.left

      if (align === "end") {
        left = rect.right - (contentRef.current?.offsetWidth || 200)
      } else if (align === "center") {
        left = rect.left + rect.width / 2 - (contentRef.current?.offsetWidth || 200) / 2
      }

      setPosition({
        top: rect.bottom + sideOffset,
        left: Math.max(8, left),
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
    <DropdownMenuPortal>
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
              "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              className
            )}
            role="menu"
            onClick={onClick}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </DropdownMenuPortal>
  )
}

// Group component
function DropdownMenuGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={className} {...props}>
      {children}
    </div>
  )
}

// Label component
interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
}

// Item component
interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
  variant?: "default" | "destructive"
}

function DropdownMenuItem({ className, inset, variant = "default", onClick, children, disabled, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext()

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
interface DropdownMenuCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: DropdownMenuCheckboxItemProps) {
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
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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

// Radio Group context
interface RadioGroupContextType {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

interface DropdownMenuRadioGroupProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
}

function DropdownMenuRadioGroup({ children, value, onValueChange }: DropdownMenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

// Radio Item component
interface DropdownMenuRadioItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function DropdownMenuRadioItem({ className, children, value, ...props }: DropdownMenuRadioItemProps) {
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
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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

// Separator component
function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// Shortcut component
function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

// Sub menu (simplified - no nested support for now)
function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSubTrigger({ className, children, inset, ...props }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </button>
  )
}

function DropdownMenuSubContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
