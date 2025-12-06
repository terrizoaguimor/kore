import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"

const locales = ["en", "es"] as const
type Locale = (typeof locales)[number]
const defaultLocale: Locale = "en"

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined

  // Then try Accept-Language header
  let locale: Locale = defaultLocale

  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie
  } else {
    const headersList = await headers()
    const acceptLanguage = headersList.get("Accept-Language")
    if (acceptLanguage) {
      const browserLocale = acceptLanguage.split(",")[0].split("-")[0] as Locale
      if (locales.includes(browserLocale)) {
        locale = browserLocale
      }
    }
  }

  return {
    locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default,
  }
})
