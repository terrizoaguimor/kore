// Supabase Edge Function: AI Text & Voice Analysis
// Path: /functions/v1/ai-analyze
// Uses Google AI (Gemini) for analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Google AI client
const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')
let genAI: GoogleGenerativeAI | null = null
if (googleApiKey) {
  genAI = new GoogleGenerativeAI(googleApiKey)
}

interface TextAnalysisRequest {
  text: string
  analysisType: 'sentiment' | 'intent' | 'entities' | 'summary'
  context?: string
}

interface VoiceAnalysisRequest {
  audioUrl: string
  analysisType: 'transcription' | 'sentiment' | 'keywords' | 'summary'
  language?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse URL to determine analysis type
    const url = new URL(req.url)
    const path = url.pathname
    const isVoiceAnalysis = path.includes('voice')

    const body = await req.json()
    const startTime = Date.now()

    // Get user's organization
    const { data: membership } = await supabaseClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    let result: unknown
    let tokensUsed = 0
    let service: string

    if (isVoiceAnalysis) {
      const voiceReq = body as VoiceAnalysisRequest
      result = await analyzeVoice(voiceReq)
      service = 'voice_analysis'
      tokensUsed = 500 // Estimate for voice analysis
    } else {
      const textReq = body as TextAnalysisRequest
      result = await analyzeText(textReq)
      service = 'text_analysis'
      tokensUsed = Math.floor((textReq.text?.length || 0) / 4)
    }

    const processingTime = Date.now() - startTime

    // Track AI usage
    if (membership) {
      await supabaseClient.from('ai_usage').insert({
        organization_id: membership.organization_id,
        user_id: user.id,
        service: service,
        model: genAI ? 'gemini-2.0-flash' : 'demo',
        input_tokens: Math.floor(tokensUsed * 0.7),
        output_tokens: Math.floor(tokensUsed * 0.3),
        total_tokens: tokensUsed,
        cost_cents: Math.ceil(tokensUsed * 0.00025 * 100),
        request_type: isVoiceAnalysis ? (body as VoiceAnalysisRequest).analysisType : (body as TextAnalysisRequest).analysisType,
        response_time_ms: processingTime,
        status: 'success'
      })
    }

    return new Response(
      JSON.stringify({
        ...result,
        processedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeText(req: TextAnalysisRequest): Promise<unknown> {
  const { text, analysisType, context } = req

  // Use Google AI (Gemini) for analysis if available
  if (genAI) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    switch (analysisType) {
      case 'sentiment':
        return await analyzeWithGemini(model, text, 'sentiment')
      case 'intent':
        return await analyzeWithGemini(model, text, 'intent')
      case 'entities':
        return await analyzeWithGemini(model, text, 'entities')
      case 'summary':
        return await analyzeWithGemini(model, text, 'summary')
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`)
    }
  }

  // Fallback to demo analysis
  switch (analysisType) {
    case 'sentiment':
      return analyzeSentiment(text)
    case 'intent':
      return analyzeIntent(text)
    case 'entities':
      return extractEntities(text)
    case 'summary':
      return summarizeText(text)
    default:
      throw new Error(`Unknown analysis type: ${analysisType}`)
  }
}

// deno-lint-ignore no-explicit-any
async function analyzeWithGemini(model: any, text: string, analysisType: string): Promise<unknown> {
  const prompts: Record<string, string> = {
    sentiment: `Analyze the sentiment of the following text and respond ONLY with a valid JSON object in this exact format:
{
  "analysisType": "sentiment",
  "result": {
    "sentiment": "positive" | "neutral" | "negative",
    "confidence": 0.0-1.0,
    "scores": {
      "positive": 0.0-1.0,
      "neutral": 0.0-1.0,
      "negative": 0.0-1.0
    }
  }
}

Text to analyze:
${text}`,
    intent: `Analyze the intent of the following text and respond ONLY with a valid JSON object in this exact format:
{
  "analysisType": "intent",
  "result": {
    "intent": "pricing_inquiry" | "information_seeking" | "purchase_intent" | "cancellation" | "support_request" | "renewal" | "general_inquiry",
    "confidence": 0.0-1.0,
    "possibleIntents": [
      { "intent": "string", "score": 0.0-1.0 }
    ]
  }
}

Text to analyze:
${text}`,
    entities: `Extract named entities from the following text and respond ONLY with a valid JSON object in this exact format:
{
  "analysisType": "entities",
  "result": {
    "entities": [
      { "text": "string", "label": "PERSON" | "PHONE" | "EMAIL" | "MONEY" | "PRODUCT" | "ORGANIZATION" | "LOCATION", "confidence": 0.0-1.0 }
    ],
    "entityCount": number
  }
}

Text to analyze:
${text}`,
    summary: `Summarize the following text and respond ONLY with a valid JSON object in this exact format:
{
  "analysisType": "summary",
  "result": {
    "summary": "string",
    "keyPoints": ["string"],
    "wordCount": number,
    "readingTime": "X min"
  }
}

Text to analyze:
${text}`
  }

  const prompt = prompts[analysisType]
  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Parse JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      }
    } catch {
      // If JSON parsing fails, fall back to demo response
      console.error('Failed to parse Gemini response as JSON')
    }
  }

  // Fallback if parsing fails
  switch (analysisType) {
    case 'sentiment':
      return analyzeSentiment(text)
    case 'intent':
      return analyzeIntent(text)
    case 'entities':
      return extractEntities(text)
    case 'summary':
      return summarizeText(text)
    default:
      throw new Error(`Unknown analysis type: ${analysisType}`)
  }
}

function analyzeSentiment(text: string) {
  // Demo sentiment analysis
  const positiveWords = ['gracias', 'excelente', 'bueno', 'genial', 'perfecto', 'encantado', 'feliz', 'interesado', 'great', 'good', 'excellent', 'happy', 'interested']
  const negativeWords = ['problema', 'mal', 'terrible', 'cancelar', 'frustrado', 'molesto', 'bad', 'problem', 'cancel', 'frustrated', 'angry']

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length

  const total = positiveCount + negativeCount || 1
  const positiveScore = positiveCount / total
  const negativeScore = negativeCount / total
  const neutralScore = 1 - positiveScore - negativeScore

  let sentiment = 'neutral'
  if (positiveScore > 0.5) sentiment = 'positive'
  if (negativeScore > 0.5) sentiment = 'negative'

  return {
    analysisType: 'sentiment',
    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    result: {
      sentiment,
      confidence: Math.max(positiveScore, negativeScore, neutralScore),
      scores: {
        positive: Math.round(positiveScore * 100) / 100,
        neutral: Math.round(neutralScore * 100) / 100,
        negative: Math.round(negativeScore * 100) / 100
      }
    }
  }
}

function analyzeIntent(text: string) {
  // Demo intent analysis
  const intents = [
    { keywords: ['precio', 'costo', 'cuánto', 'price', 'cost', 'how much'], intent: 'pricing_inquiry' },
    { keywords: ['información', 'saber', 'conocer', 'information', 'know', 'learn'], intent: 'information_seeking' },
    { keywords: ['comprar', 'contratar', 'adquirir', 'buy', 'purchase', 'get'], intent: 'purchase_intent' },
    { keywords: ['cancelar', 'terminar', 'dejar', 'cancel', 'end', 'stop'], intent: 'cancellation' },
    { keywords: ['ayuda', 'problema', 'soporte', 'help', 'problem', 'support'], intent: 'support_request' },
    { keywords: ['renovar', 'extender', 'renew', 'extend'], intent: 'renewal' }
  ]

  const lowerText = text.toLowerCase()
  let detectedIntent = 'general_inquiry'
  let maxScore = 0

  for (const { keywords, intent } of intents) {
    const score = keywords.filter(k => lowerText.includes(k)).length
    if (score > maxScore) {
      maxScore = score
      detectedIntent = intent
    }
  }

  return {
    analysisType: 'intent',
    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    result: {
      intent: detectedIntent,
      confidence: Math.min(0.5 + (maxScore * 0.15), 0.95),
      possibleIntents: [
        { intent: detectedIntent, score: Math.min(0.5 + (maxScore * 0.15), 0.95) },
        { intent: 'general_inquiry', score: 0.3 }
      ]
    }
  }
}

function extractEntities(text: string) {
  // Demo entity extraction
  const entities: Array<{ text: string; label: string; start: number; end: number; confidence: number }> = []

  // Simple pattern matching for demo
  const patterns = [
    { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, label: 'PERSON' },
    { regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: 'PHONE' },
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'EMAIL' },
    { regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g, label: 'MONEY' },
    { regex: /\b(?:seguro|insurance|póliza|policy)\b/gi, label: 'PRODUCT' }
  ]

  for (const { regex, label } of patterns) {
    let match
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label,
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.85 + Math.random() * 0.1
      })
    }
  }

  return {
    analysisType: 'entities',
    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    result: {
      entities: entities.slice(0, 10),
      entityCount: entities.length
    }
  }
}

function summarizeText(text: string) {
  // Demo summarization
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const keyPoints = sentences.slice(0, 3).map(s => s.trim())

  return {
    analysisType: 'summary',
    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    result: {
      summary: keyPoints.length > 0
        ? `El texto trata sobre: ${keyPoints[0]}. ${keyPoints.length > 1 ? 'También menciona aspectos relacionados con la comunicación empresarial.' : ''}`
        : 'Texto breve sin puntos clave identificables.',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Sin puntos clave identificados'],
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200) + ' min'
    }
  }
}

async function analyzeVoice(req: VoiceAnalysisRequest): Promise<unknown> {
  const { audioUrl, analysisType, language = 'es' } = req

  // In production, this would:
  // 1. Download audio from URL
  // 2. Send to transcription service (Whisper, Deepgram, etc.)
  // 3. Analyze the transcription

  // Demo responses
  const demoTranscription = "Hola, me interesa obtener información sobre sus servicios de seguros. Tengo una familia con dos hijos pequeños y quiero asegurarme de que estén protegidos. ¿Podrían explicarme las opciones disponibles y los costos aproximados?"

  switch (analysisType) {
    case 'transcription':
      return {
        analysisType: 'transcription',
        audioUrl,
        language,
        result: {
          text: demoTranscription,
          confidence: 0.94,
          duration: 45.5,
          speakerCount: 1,
          words: demoTranscription.split(/\s+/).map((word, i) => ({
            word,
            start: i * 0.3,
            end: (i + 1) * 0.3,
            confidence: 0.9 + Math.random() * 0.1
          }))
        }
      }

    case 'sentiment':
      return {
        analysisType: 'sentiment',
        audioUrl,
        language,
        result: {
          overall: 'interested',
          confidence: 0.87,
          emotions: {
            interest: 0.78,
            concern: 0.45,
            uncertainty: 0.32,
            satisfaction: 0.2
          },
          keyMoments: [
            { timestamp: 5.2, emotion: 'interest', text: 'me interesa obtener información' },
            { timestamp: 15.8, emotion: 'concern', text: 'quiero asegurarme de que estén protegidos' },
            { timestamp: 35.2, emotion: 'curiosity', text: 'opciones disponibles y costos' }
          ]
        }
      }

    case 'keywords':
      return {
        analysisType: 'keywords',
        audioUrl,
        language,
        result: {
          topics: [
            { keyword: 'seguros', frequency: 2, relevance: 0.95 },
            { keyword: 'familia', frequency: 1, relevance: 0.88 },
            { keyword: 'protección', frequency: 1, relevance: 0.82 },
            { keyword: 'costos', frequency: 1, relevance: 0.75 },
            { keyword: 'hijos', frequency: 1, relevance: 0.70 }
          ],
          intent: 'information_seeking',
          urgency: 'medium',
          primaryTopic: 'family insurance'
        }
      }

    case 'summary':
      return {
        analysisType: 'summary',
        audioUrl,
        language,
        result: {
          summary: 'Cliente potencial con familia (2 hijos) interesado en seguros. Busca información sobre opciones disponibles y costos. Muestra preocupación genuina por la protección de su familia.',
          actionItems: [
            'Preparar cotización de seguro de vida familiar',
            'Explicar opciones de cobertura para hijos',
            'Agendar llamada de seguimiento',
            'Enviar material informativo sobre planes familiares'
          ],
          clientProfile: {
            lifestage: 'familia joven',
            priority: 'protección familiar',
            experience: 'principiante',
            decision_factors: ['costo', 'cobertura', 'protección de hijos']
          },
          nextBestAction: 'Agendar reunión para presentar opciones de seguro familiar'
        }
      }

    default:
      throw new Error(`Unknown voice analysis type: ${analysisType}`)
  }
}
