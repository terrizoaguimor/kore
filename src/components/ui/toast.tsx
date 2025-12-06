"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = "default", onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
        variant === "default" && "border-[#2A2A2A] bg-[#1F1F1F] text-white",
        variant === "destructive" && "border-red-500/50 bg-red-500/10 text-red-400"
      )}
    >
      <div className="flex-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm text-[#A1A1AA]">{description}</div>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#A1A1AA] hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:right-4 sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  )
}
