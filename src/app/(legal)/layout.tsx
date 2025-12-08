"use client"

import Link from "next/link"
import { Brain, ArrowLeft } from "lucide-react"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0B] relative">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[400px] -left-[400px] w-[800px] h-[800px] bg-[#00E5FF]/[0.03] rounded-full blur-[150px]" />
        <div className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] bg-[#8B5CF6]/[0.03] rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center shadow-lg shadow-[#00E5FF]/20 group-hover:shadow-[#00E5FF]/40 transition-all">
              <Brain className="h-5 w-5 text-[#0B0B0B]" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-[#00E5FF] bg-clip-text text-transparent">KORE</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#A1A1AA]">
              © {new Date().getFullYear()} KORE. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-sm text-[#A1A1AA] hover:text-[#00E5FF] transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-[#A1A1AA] hover:text-[#00E5FF] transition-colors">
                Privacy
              </Link>
              <Link href="/status" className="text-sm text-[#A1A1AA] hover:text-[#00E5FF] transition-colors">
                Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
