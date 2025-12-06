"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#1F1F1F",
          color: "#fff",
          border: "1px solid #2A2A2A",
        },
      }}
    />
  )
}
