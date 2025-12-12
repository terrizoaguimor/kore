import type { Metadata } from "next"
import { Montserrat, Inter } from "next/font/google"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { IntlProvider } from "@/components/providers/intl-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

// Títulos - Montserrat ExtraBold (Brand Guidelines)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

// Body/Subtitles - Inter Tight (Brand Guidelines)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "KORE By Socios - The Origin of Everything",
    template: "%s | KORE By Socios",
  },
  description: "KORE By Socios: Complete CRM Marketing Suite. The origin of everything — Files, Calendar, Contacts, Chat, Office, Voice, and Marketing Automation all in one powerful platform.",
  keywords: [
    "CRM",
    "marketing automation",
    "email marketing",
    "sales CRM",
    "customer relationship management",
    "marketing suite",
    "business software",
    "cloud platform",
    "collaboration tools",
    "file storage",
    "calendar",
    "contacts management",
    "team chat",
    "office suite",
    "voice calls",
    "WhatsApp business",
    "lead management",
    "sales pipeline",
    "KORE",
    "Socios Del Negocio",
  ],
  authors: [{ name: "Socios Del Negocio" }],
  creator: "KORE By Socios",
  publisher: "Socios Del Negocio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_ES",
    url: "https://kore.app",
    title: "KORE By Socios - The Origin of Everything",
    description: "Complete CRM Marketing Suite by Socios Del Negocio. Files, Calendar, Contacts, Chat, Office, Voice & Marketing Automation — all in one platform.",
    siteName: "KORE By Socios",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KORE By Socios - Complete CRM Marketing Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KORE By Socios - The Origin of Everything",
    description: "Complete CRM Marketing Suite by Socios Del Negocio. Files, Calendar, Contacts, Chat, Office, Voice & Marketing Automation.",
    images: ["/og-image.png"],
    creator: "@sociosdelnegocio",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://kore.app"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en",
      "es-ES": "/es",
    },
  },
  category: "business",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <IntlProvider locale={locale} messages={messages}>
            {children}
            <Toaster />
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
