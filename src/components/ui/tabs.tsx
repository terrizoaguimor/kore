"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

// Context for tabs state
interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs")
  }
  return context
}

// Root component
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

function Tabs({ className, value: controlledValue, onValueChange, defaultValue = "", children, ...props }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// List component
function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Trigger component
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function TabsTrigger({ className, value, children, disabled }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext()
  const isSelected = selectedValue === value

  return (
    <motion.button
      role="tab"
      type="button"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}

// Content component
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function TabsContent({ className, value, children }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  const isSelected = selectedValue === value

  if (!isSelected) return null

  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex-1 outline-none", className)}
    >
      {children}
    </motion.div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
