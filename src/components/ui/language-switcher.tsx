"use client"

import { useLocale } from "next-intl"
import { useTransition } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config"

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      // Set cookie and reload
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
      window.location.reload()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isPending}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSwitcherSimple() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const newLocale = locale === "en" ? "es" : "en"
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
      window.location.reload()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
    >
      <span>{localeFlags[locale as Locale]}</span>
      <span className="text-xs font-medium uppercase">{locale}</span>
    </Button>
  )
}
