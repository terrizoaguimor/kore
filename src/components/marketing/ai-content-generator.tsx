"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Sparkles, Send, Copy, Download, RefreshCw, Mail, MessageSquare, FileText, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AIContentType, AIContentTone, AIContentLength, AIContentGenerationRequest, AIContentGenerationResponse } from "@/types/marketing"

const contentTypes: Array<{ id: AIContentType; label: string; icon: typeof Mail }> = [
  { id: 'email', label: 'Email Marketing', icon: Mail },
  { id: 'social_post', label: 'Redes Sociales', icon: MessageSquare },
  { id: 'blog_post', label: 'Blog Post', icon: FileText },
  { id: 'ad_copy', label: 'Anuncio', icon: Zap },
  { id: 'proposal', label: 'Propuesta', icon: FileText },
  { id: 'followup', label: 'Seguimiento', icon: Mail },
]

const tones: Array<{ id: AIContentTone; label: string }> = [
  { id: 'professional', label: 'Profesional' },
  { id: 'friendly', label: 'Amigable' },
  { id: 'urgent', label: 'Urgente' },
  { id: 'educational', label: 'Educativo' },
  { id: 'promotional', label: 'Promocional' },
]

const lengths: Array<{ id: AIContentLength; label: string; description: string }> = [
  { id: 'short', label: 'Corto', description: '50-100 palabras' },
  { id: 'medium', label: 'Mediano', description: '150-250 palabras' },
  { id: 'long', label: 'Largo', description: '300-500 palabras' },
]

const quickTemplates = [
  { name: 'Bienvenida Nuevo Cliente', topic: 'Bienvenida y onboarding para nuevos clientes' },
  { name: 'Promoción de Servicios', topic: 'Promoción especial de nuestros servicios principales' },
  { name: 'Seguimiento de Propuesta', topic: 'Seguimiento a propuesta comercial enviada' },
  { name: 'Contenido Educativo', topic: 'Información educativa sobre nuestro sector' },
]

interface AIContentGeneratorProps {
  accentColor?: string
  onContentGenerated?: (content: string) => void
}

export function AIContentGenerator({ accentColor = "#FF6B6B", onContentGenerated }: AIContentGeneratorProps) {
  const [contentType, setContentType] = useState<AIContentType>('email')
  const [tone, setTone] = useState<AIContentTone>('professional')
  const [length, setLength] = useState<AIContentLength>('medium')
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [monthlyLimit] = useState(100)

  const generateContent = async () => {
    if (!topic.trim()) {
      return
    }

    setIsGenerating(true)

    try {
      // Call Supabase Edge Function
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          tone,
          length,
          topic,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        } as AIContentGenerationRequest),
      })

      if (!response.ok) {
        throw new Error('Error generating content')
      }

      const data: AIContentGenerationResponse = await response.json()
      setGeneratedContent(data.content)
      setUsageCount(prev => prev + 1)
      onContentGenerated?.(data.content)
    } catch (error) {
      console.error('Error generating content:', error)
      // Demo fallback content
      const demoContent = generateDemoContent()
      setGeneratedContent(demoContent)
      setUsageCount(prev => prev + 1)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateDemoContent = () => {
    const templates: Record<AIContentType, string> = {
      email: `Asunto: ${topic}\n\nEstimado/a Cliente,\n\nNos ponemos en contacto para informarle sobre ${topic}.\n\nEn KORE, nos comprometemos a brindarle las mejores soluciones. Hemos preparado opciones que creemos serán perfectas para su situación.\n\n¿Le gustaría agendar una llamada esta semana?\n\nSaludos cordiales,\nEquipo KORE`,
      social_post: `🚀 ${topic}\n\n¿Sabías que esto puede transformar tu negocio?\n\n✅ Resultados comprobados\n✅ Soluciones personalizadas\n✅ Soporte continuo\n\n👉 Contáctanos hoy\n\n#KORE #Marketing #Éxito`,
      blog_post: `# ${topic}\n\n## Introducción\n\nEn el competitivo mercado actual, ${topic} se ha convertido en un factor clave para el éxito.\n\n## Beneficios Principales\n\n- Mayor eficiencia\n- Mejores resultados\n- Ventaja competitiva\n\n## Conclusión\n\nEn KORE, estamos listos para ayudarte.`,
      ad_copy: `🎯 ${topic}\n\n¿Listo para el siguiente nivel?\n\n✓ Resultados garantizados\n✓ Atención personalizada\n✓ Precios competitivos\n\n¡Solicita tu consulta gratuita!`,
      landing_page: `# ${topic}\n\nTransforma tu negocio con KORE\n\n## ¿Por qué elegirnos?\n\n- Experiencia comprobada\n- Equipo dedicado\n- Resultados medibles\n\n[Solicitar Demo]`,
      proposal: `# Propuesta: ${topic}\n\n## Resumen Ejecutivo\n\nHemos diseñado una solución personalizada para abordar ${topic}.\n\n## Nuestra Propuesta\n\n- Análisis inicial\n- Implementación\n- Soporte continuo\n\n## Próximos Pasos\n\nAgendar reunión de clarificación.`,
      followup: `Hola,\n\nEspero que estés bien. Quería dar seguimiento a nuestra conversación sobre ${topic}.\n\n¿Has tenido oportunidad de revisar la información?\n\nQuedo atento a tu respuesta.\n\nSaludos,\nEquipo KORE`,
      objection_response: `Entiendo tu preocupación sobre ${topic}.\n\nEs una pregunta válida. Aquí está cómo lo abordamos:\n\n1. Entendemos tu situación\n2. Ofrecemos soluciones flexibles\n3. Garantizamos resultados\n\n¿Exploramos las opciones juntos?`
    }
    return templates[contentType] || templates.email
  }

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-6">
        {/* Content Type */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Tipo de Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      contentType === type.id
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                    }`}
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  >
                    <Icon className={`h-4 w-4 ${contentType === type.id ? 'text-[var(--accent)]' : 'text-[#A1A1AA]'}`} style={{ '--accent': accentColor } as React.CSSProperties} />
                    <span className={`text-sm ${contentType === type.id ? 'text-white' : 'text-[#A1A1AA]'}`}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Tono del Mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    tone === t.id
                      ? 'text-white'
                      : 'bg-[#2A2A2A] text-[#A1A1AA] hover:bg-[#3A3A3A]'
                  }`}
                  style={tone === t.id ? { backgroundColor: accentColor } : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Length */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Longitud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lengths.map((l) => (
                <label
                  key={l.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    length === l.id
                      ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                      : 'bg-[#2A2A2A] border-2 border-transparent hover:bg-[#3A3A3A]'
                  }`}
                  style={{ '--accent': accentColor } as React.CSSProperties}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="length"
                      value={l.id}
                      checked={length === l.id}
                      onChange={(e) => setLength(e.target.value as AIContentLength)}
                      className="sr-only"
                    />
                    <span className="font-medium text-white">{l.label}</span>
                  </div>
                  <span className="text-sm text-[#A1A1AA]">{l.description}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-white">Tema o Producto *</Label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Lanzamiento de nuevo producto, Promoción de verano..."
                className="mt-2 bg-[#0f1a4a] border-[#2A2A2A] text-white"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-white">Palabras clave (opcional)</Label>
              <Input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="marketing, ventas, crecimiento (separadas por coma)"
                className="mt-2 bg-[#0f1a4a] border-[#2A2A2A] text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card className="bg-[#1F1F1F] border-[#2A2A2A]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Plantillas Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopic(template.topic)}
                  className="w-full text-left p-3 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors"
                >
                  <p className="text-sm font-medium text-white">{template.name}</p>
                  <p className="text-xs text-[#A1A1AA] mt-1">{template.topic}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={generateContent}
          disabled={isGenerating || !topic.trim() || usageCount >= monthlyLimit}
          className="w-full"
          style={{ backgroundColor: accentColor }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Contenido
            </>
          )}
        </Button>
      </div>

      {/* Output Panel */}
      <div>
        <Card className="bg-[#1F1F1F] border-[#2A2A2A] h-full flex flex-col">
          <CardHeader className="border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Contenido Generado</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A1A1AA]">
                  {usageCount}/{monthlyLimit} este mes
                </span>
                {generatedContent && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyContent}
                      className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                      title="Copiar"
                    >
                      <Copy className="h-4 w-4 text-[#A1A1AA]" />
                    </button>
                    <button
                      onClick={generateContent}
                      className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                      title="Regenerar"
                    >
                      <RefreshCw className="h-4 w-4 text-[#A1A1AA]" />
                    </button>
                    <button
                      className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4 text-[#A1A1AA]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6">
            {generatedContent ? (
              <div className="h-full">
                <pre className="whitespace-pre-wrap text-sm text-[#E1E1E1] font-sans leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: accentColor, opacity: 0.3 }} />
                  <p className="text-[#A1A1AA]">
                    Configura los parámetros y genera contenido personalizado con IA
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {generatedContent && (
            <div className="p-4 border-t border-[#2A2A2A] bg-[#0f1a4a]/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[#A1A1AA]">
                    Palabras: {generatedContent.split(/\s+/).length}
                  </span>
                  <span className="text-[#A1A1AA]">
                    Caracteres: {generatedContent.length}
                  </span>
                </div>
                <Button size="sm" style={{ backgroundColor: accentColor }}>
                  <Send className="mr-2 h-4 w-4" />
                  Usar en Campaña
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
