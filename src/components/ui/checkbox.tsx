"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  defaultChecked?: boolean
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked: controlledChecked, onCheckedChange, defaultChecked = false, disabled, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked)

    const isControlled = controlledChecked !== undefined
    const checked = isControlled ? controlledChecked : uncontrolledChecked

    const handleClick = () => {
      if (disabled) return
      const newValue = !checked
      if (!isControlled) {
        setUncontrolledChecked(newValue)
      }
      onCheckedChange?.(newValue)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background",
          className
        )}
        {...props}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.1 }}
              className="flex items-center justify-center text-current"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
