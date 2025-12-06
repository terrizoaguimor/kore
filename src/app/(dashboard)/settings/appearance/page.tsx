"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowLeft, Loader2, Sun, Moon, Monitor, Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const themes = [
  {
    id: "light",
    name: "Light",
    icon: Sun,
    description: "A clean light theme for daytime use",
  },
  {
    id: "dark",
    name: "Dark",
    icon: Moon,
    description: "Easy on the eyes, perfect for night",
  },
  {
    id: "system",
    name: "System",
    icon: Monitor,
    description: "Automatically match your system settings",
  },
]

const accentColors = [
  { id: "blue", name: "Blue", color: "#2f62ea" },
  { id: "purple", name: "Purple", color: "#8B5CF6" },
  { id: "green", name: "Green", color: "#10B981" },
  { id: "red", name: "Red", color: "#EF4444" },
  { id: "orange", name: "Orange", color: "#F59E0B" },
  { id: "pink", name: "Pink", color: "#EC4899" },
]

const fontSizes = [
  { id: "small", name: "Small", size: "14px" },
  { id: "medium", name: "Medium", size: "16px" },
  { id: "large", name: "Large", size: "18px" },
]

export default function AppearanceSettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accentColor, setAccentColor] = useState("blue")
  const [fontSize, setFontSize] = useState("medium")

  useEffect(() => {
    setMounted(true)
    // Load saved preferences from localStorage
    const savedAccent = localStorage.getItem("accent-color")
    const savedFontSize = localStorage.getItem("font-size")
    if (savedAccent) setAccentColor(savedAccent)
    if (savedFontSize) setFontSize(savedFontSize)
  }, [])

  const handleAccentChange = (color: string) => {
    setAccentColor(color)
    localStorage.setItem("accent-color", color)
    // Apply accent color to CSS variables
    const colorValue = accentColors.find((c) => c.id === color)?.color || "#2f62ea"
    document.documentElement.style.setProperty("--primary", colorValue)
    toast.success("Accent color updated")
  }

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    localStorage.setItem("font-size", size)
    const sizeValue = fontSizes.find((f) => f.id === size)?.size || "16px"
    document.documentElement.style.setProperty("--base-font-size", sizeValue)
    toast.success("Font size updated")
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b bg-background px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Appearance</h1>
          <p className="text-sm text-muted-foreground">Customize the look and feel</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Select your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {themes.map((t) => {
                  const Icon = t.icon
                  const isSelected = theme === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute right-2 top-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-full p-3",
                        t.id === "light" ? "bg-yellow-100 text-yellow-600" :
                        t.id === "dark" ? "bg-slate-800 text-slate-200" :
                        "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-center text-muted-foreground">
                        {t.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Accent Color</CardTitle>
              </div>
              <CardDescription>Choose your primary accent color</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleAccentChange(color.id)}
                    className={cn(
                      "relative h-10 w-10 rounded-full transition-all",
                      accentColor === color.id && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{
                      backgroundColor: color.color,
                      ...(accentColor === color.id && { ringColor: color.color }),
                    }}
                    title={color.name}
                  >
                    {accentColor === color.id && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle>Font Size</CardTitle>
              <CardDescription>Adjust the text size for better readability</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={fontSize}
                onValueChange={handleFontSizeChange}
                className="flex gap-4"
              >
                {fontSizes.map((size) => (
                  <div key={size.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.id} id={size.id} />
                    <Label htmlFor={size.id} className="cursor-pointer">
                      <span style={{ fontSize: size.size }}>{size.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your choices look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">Sample User</p>
                    <p className="text-sm text-muted-foreground">sample@example.com</p>
                  </div>
                </div>
                <p className="text-sm">
                  This is how your text will appear with the current settings.
                  The accent color affects buttons, links, and other interactive elements.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Primary Button</Button>
                  <Button size="sm" variant="outline">Secondary</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
