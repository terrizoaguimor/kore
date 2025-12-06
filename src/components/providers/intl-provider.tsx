"use client"

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl"
import { ReactNode } from "react"

interface IntlProviderProps {
  locale: string
  messages: AbstractIntlMessages
  children: ReactNode
}

export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
