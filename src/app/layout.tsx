import type { Metadata } from "next"
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { IntlProvider } from "@/components/providers/intl-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

// Body font - Clean and readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

// Display font - Modern geometric (similar to Monument Extended)
const spaceGrotesk = Space_Grotesk({
  variable: "--font-monument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "KORE - The Origin of Everything",
    template: "%s | KORE",
  },
  description: "KORE: Complete CRM Marketing Suite. The origin of everything — Files, Calendar, Contacts, Chat, Office, Voice, and Marketing Automation all in one powerful platform.",
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
  ],
  authors: [{ name: "KORE Team" }],
  creator: "KORE",
  publisher: "KORE",
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
    title: "KORE - The Origin of Everything",
    description: "Complete CRM Marketing Suite. Files, Calendar, Contacts, Chat, Office, Voice & Marketing Automation — all in one platform.",
    siteName: "KORE",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KORE - Complete CRM Marketing Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KORE - The Origin of Everything",
    description: "Complete CRM Marketing Suite. Files, Calendar, Contacts, Chat, Office, Voice & Marketing Automation.",
    images: ["/og-image.png"],
    creator: "@kaborecr",
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
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased`}
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
