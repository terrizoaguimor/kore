"use client"

import * as React from "react"

export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Also open with / when not in an input
      if (e.key === "/" && !isInputElement(e.target)) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target) return false
  const element = target as HTMLElement
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  )
}
