"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Sparkles, ArrowLeft } from "lucide-react"
import { AIContentGenerator } from "@/components/marketing"
import { useToast } from "@/hooks/use-toast"

export default function AIContentPage() {
  const { toast } = useToast()
  const accentColor = "#FF4757"

  const handleContentGenerated = (content: string) => {
    toast({
      title: "Contenido generado",
      description: "El contenido ha sido generado exitosamente.",
    })
  }

  return (
    <div className="min-h-full bg-[#0B0B0B] p-6">
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Pulse
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Generador de Contenido con IA</h1>
        </div>
        <p className="text-[#A1A1AA]">
          Crea contenido de marketing personalizado con inteligencia artificial
        </p>
      </motion.div>

      {/* AI Content Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AIContentGenerator
          accentColor={accentColor}
          onContentGenerated={handleContentGenerated}
        />
      </motion.div>
    </div>
  )
}
