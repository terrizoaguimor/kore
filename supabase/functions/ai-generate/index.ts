// Supabase Edge Function: AI Content Generation
// Path: /functions/v1/ai-generate
// Uses Google AI (Gemini) for content generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateContentRequest {
  content_type: 'email' | 'social_post' | 'blog_post' | 'ad_copy' | 'landing_page' | 'proposal' | 'followup' | 'objection_response'
  tone?: 'professional' | 'friendly' | 'urgent' | 'educational' | 'promotional' | 'casual' | 'formal'
  length?: 'short' | 'medium' | 'long'
  topic: string
  keywords?: string[]
  audience?: string
  context?: {
    clientName?: string
    productType?: string
    companyName?: string
  }
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

    // Parse request body
    const body: GenerateContentRequest = await req.json()

    // Validate required fields
    if (!body.topic || !body.content_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: topic, content_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tone = body.tone || 'professional'
    const length = body.length || 'medium'
    const startTime = Date.now()

    // Generate content using Google AI (Gemini)
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')

    let generatedContent: string
    let tokensUsed = 0

    if (googleApiKey) {
      // Real Google AI (Gemini) API call
      const genAI = new GoogleGenerativeAI(googleApiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const systemPrompt = buildSystemPrompt(body.content_type, tone, length)
      const userPrompt = buildUserPrompt(body)
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

      const result = await model.generateContent(fullPrompt)
      const response = result.response

      if (response && response.text()) {
        generatedContent = response.text()
        // Estimate tokens (Gemini doesn't always return exact token counts)
        tokensUsed = Math.floor((fullPrompt.length + generatedContent.length) / 4)
      } else {
        throw new Error('Failed to generate content from AI')
      }
    } else {
      // Demo mode - generate sample content
      generatedContent = generateDemoContent(body)
      tokensUsed = Math.floor(generatedContent.length / 4)
    }

    const generationTime = Date.now() - startTime

    // Get user's organization
    const { data: membership } = await supabaseClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    // Save generation to database
    if (membership) {
      await supabaseClient.from('ai_content_generations').insert({
        organization_id: membership.organization_id,
        user_id: user.id,
        content_type: body.content_type,
        tone: tone,
        length: length,
        topic: body.topic,
        keywords: body.keywords || [],
        audience: body.audience,
        context: body.context || {},
        generated_content: generatedContent,
        word_count: generatedContent.split(/\s+/).length,
        model_used: googleApiKey ? 'gemini-2.0-flash' : 'demo',
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      })

      // Track AI usage
      await supabaseClient.from('ai_usage').insert({
        organization_id: membership.organization_id,
        user_id: user.id,
        service: 'content_generation',
        model: googleApiKey ? 'gemini-2.0-flash' : 'demo',
        input_tokens: Math.floor(tokensUsed * 0.3),
        output_tokens: Math.floor(tokensUsed * 0.7),
        total_tokens: tokensUsed,
        cost_cents: Math.ceil(tokensUsed * 0.00025 * 100), // ~$0.25 per 1M tokens
        request_type: body.content_type,
        response_time_ms: generationTime,
        status: 'success'
      })
    }

    // Return response
    return new Response(
      JSON.stringify({
        content: generatedContent,
        type: body.content_type,
        topic: body.topic,
        tone: tone,
        length: length,
        generatedAt: new Date().toISOString(),
        wordCount: generatedContent.split(/\s+/).length,
        tokensUsed: tokensUsed,
        generationTimeMs: generationTime,
        suggestions: getSuggestions(body.content_type)
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

function buildSystemPrompt(contentType: string, tone: string, length: string): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'Use a professional, business-appropriate tone',
    friendly: 'Use a warm, approachable, and friendly tone',
    urgent: 'Use an urgent tone that creates a sense of immediacy',
    educational: 'Use an informative, educational tone',
    promotional: 'Use a persuasive, promotional marketing tone',
    casual: 'Use a casual, conversational tone',
    formal: 'Use a formal, corporate tone'
  }

  const lengthDescriptions: Record<string, string> = {
    short: '50-100 words',
    medium: '150-250 words',
    long: '300-500 words'
  }

  return `You are a professional marketing content writer. Generate ${contentType.replace('_', ' ')} content.
${toneDescriptions[tone] || toneDescriptions.professional}.
Target length: ${lengthDescriptions[length] || lengthDescriptions.medium}.
Always write in the language appropriate for the target audience.
Include compelling calls-to-action when appropriate.
Make the content engaging and relevant to the topic.`
}

function buildUserPrompt(body: GenerateContentRequest): string {
  let prompt = `Generate ${body.content_type.replace('_', ' ')} content about: ${body.topic}`

  if (body.keywords && body.keywords.length > 0) {
    prompt += `\n\nInclude these keywords: ${body.keywords.join(', ')}`
  }

  if (body.audience) {
    prompt += `\n\nTarget audience: ${body.audience}`
  }

  if (body.context?.clientName) {
    prompt += `\n\nClient name: ${body.context.clientName}`
  }

  if (body.context?.productType) {
    prompt += `\n\nProduct/Service: ${body.context.productType}`
  }

  if (body.context?.companyName) {
    prompt += `\n\nCompany: ${body.context.companyName}`
  }

  return prompt
}

function getMaxTokens(length: string): number {
  switch (length) {
    case 'short': return 200
    case 'medium': return 500
    case 'long': return 1000
    default: return 500
  }
}

function getSuggestions(contentType: string): string[] {
  const suggestions: Record<string, string[]> = {
    email: [
      'Consider adding a clear call-to-action',
      'Personalize the subject line',
      'Test different sending times',
      'Keep the subject under 50 characters'
    ],
    social_post: [
      'Add relevant hashtags',
      'Include an image or video',
      'Ask a question to increase engagement',
      'Post at peak engagement times'
    ],
    blog_post: [
      'Add relevant internal and external links',
      'Include keywords for SEO',
      'Break up text with subheadings',
      'Add a compelling meta description'
    ],
    ad_copy: [
      'Test multiple variations',
      'Include social proof',
      'Create urgency',
      'Focus on benefits over features'
    ],
    landing_page: [
      'Ensure mobile responsiveness',
      'Add trust signals',
      'Minimize form fields',
      'Use compelling visuals'
    ],
    proposal: [
      'Include case studies',
      'Add pricing transparency',
      'Highlight ROI',
      'Include testimonials'
    ],
    followup: [
      'Reference previous conversation',
      'Provide additional value',
      'Include specific next steps',
      'Keep it concise'
    ],
    objection_response: [
      'Acknowledge the concern',
      'Provide evidence',
      'Offer alternatives',
      'Ask clarifying questions'
    ]
  }

  return suggestions[contentType] || ['Review and personalize', 'Test with target audience', 'Track performance metrics']
}

function generateDemoContent(body: GenerateContentRequest): string {
  const { content_type, topic, tone, length, context } = body
  const clientName = context?.clientName || '[Cliente]'
  const productType = context?.productType || 'nuestros servicios'
  const companyName = context?.companyName || 'KORE'

  const templates: Record<string, Record<string, string>> = {
    email: {
      short: `Asunto: ${topic}\n\nHola ${clientName},\n\nEsperamos que te encuentres bien. Te escribimos para informarte sobre ${topic}.\n\nSaludos cordiales,\nEquipo ${companyName}`,
      medium: `Asunto: Información importante sobre ${topic}\n\nEstimado/a ${clientName},\n\nNos ponemos en contacto contigo para compartir información valiosa sobre ${topic}.\n\nEn ${companyName}, nos comprometemos a brindarte las mejores soluciones para ${productType}. Hemos preparado algunas opciones que creemos serán perfectas para tu situación.\n\n¿Te gustaría agendar una llamada esta semana para revisar los detalles?\n\nQuedamos atentos a tu respuesta.\n\nSaludos cordiales,\nEquipo ${companyName}`,
      long: `Asunto: Todo lo que necesitas saber sobre ${topic}\n\nEstimado/a ${clientName},\n\nEspero que este mensaje te encuentre muy bien. Me dirijo a ti para compartir información detallada sobre ${topic} y cómo puede beneficiarte.\n\nEn ${companyName}, entendemos que tomar decisiones importantes requiere información completa y precisa. Por eso, he preparado este resumen con los puntos más relevantes:\n\n1. Beneficios principales de ${productType}\n2. Cómo se adapta a tus necesidades específicas\n3. Próximos pasos recomendados\n\nNuestro equipo está disponible para resolver cualquier duda que puedas tener. Podemos agendar una reunión virtual o presencial según tu preferencia.\n\n¿Cuándo sería un buen momento para ti?\n\nQuedo a tu disposición.\n\nSaludos cordiales,\nEquipo ${companyName}`
    },
    social_post: {
      short: `🎯 ${topic}\n\n¡Descubre más con ${companyName}! #Marketing #Innovación`,
      medium: `🚀 ${topic}\n\n¿Sabías que ${productType} puede transformar tu negocio? En ${companyName} te ayudamos a alcanzar tus metas.\n\n✅ Soluciones personalizadas\n✅ Resultados comprobados\n✅ Soporte continuo\n\n👉 Contáctanos hoy\n\n#${companyName} #Éxito #Crecimiento`,
      long: `💡 ${topic}\n\nEn el mundo empresarial actual, ${productType} es más importante que nunca. En ${companyName}, hemos ayudado a cientos de empresas a alcanzar sus objetivos.\n\n🎯 Nuestro enfoque:\n\n1️⃣ Análisis personalizado\n2️⃣ Estrategias a medida\n3️⃣ Implementación efectiva\n4️⃣ Seguimiento continuo\n\n📈 Los resultados hablan por sí solos:\n• +50% en conversiones\n• +35% en engagement\n• ROI comprobado\n\n¿Listo para el siguiente nivel? 🚀\n\n👇 Comenta "INFO" y te contactamos\n\n#Marketing #Negocios #Éxito #${companyName}`
    },
    blog_post: {
      short: `# ${topic}\n\nDescubre cómo ${topic} puede transformar tu estrategia de negocio con ${companyName}.`,
      medium: `# Guía Completa: ${topic}\n\n## Introducción\n\nEn el competitivo mercado actual, ${topic} se ha convertido en un factor clave para el éxito empresarial.\n\n## ¿Por qué es importante?\n\n${productType} ofrece ventajas significativas que no puedes ignorar.\n\n## Beneficios principales\n\n- Mayor eficiencia operativa\n- Mejores resultados medibles\n- Ventaja competitiva sostenible\n\n## Conclusión\n\nEn ${companyName}, estamos listos para ayudarte a implementar estas estrategias.`,
      long: `# Todo lo que Necesitas Saber sobre ${topic}\n\n## Introducción\n\n${topic} representa una de las oportunidades más significativas para las empresas modernas. En esta guía completa, exploraremos todos los aspectos relevantes.\n\n## ¿Qué es ${topic}?\n\nSe trata de una estrategia integral que permite a las organizaciones optimizar sus procesos y mejorar resultados.\n\n## Beneficios Clave\n\n### 1. Eficiencia Mejorada\n\nLa implementación de ${productType} puede aumentar la productividad hasta en un 40%.\n\n### 2. Reducción de Costos\n\nLas empresas reportan ahorros significativos en sus operaciones diarias.\n\n### 3. Mejor Experiencia del Cliente\n\nLos clientes satisfechos son la base del crecimiento sostenible.\n\n## Cómo Implementarlo\n\n1. Evaluación inicial\n2. Planificación estratégica\n3. Ejecución por fases\n4. Medición y optimización\n\n## Casos de Éxito\n\nEmpresas como las tuyas han logrado resultados extraordinarios con ${companyName}.\n\n## Conclusión\n\nNo esperes más para transformar tu negocio. Contáctanos en ${companyName} para comenzar tu viaje hacia el éxito.`
    },
    ad_copy: {
      short: `${topic} - Tu solución está aquí. ¡Contáctanos hoy!`,
      medium: `¿Buscas ${topic}? ${companyName} tiene la solución perfecta.\n\n✓ Resultados garantizados\n✓ Atención personalizada\n✓ Precios competitivos\n\n¡Solicita tu consulta gratuita!`,
      long: `🎯 ${topic}\n\n¿Estás listo para llevar tu negocio al siguiente nivel?\n\nEn ${companyName} ofrecemos ${productType} que realmente funciona:\n\n✅ Estrategias probadas\n✅ Equipo experto\n✅ Resultados medibles\n✅ Soporte 24/7\n\n⭐ Miles de clientes satisfechos\n📈 ROI comprobado\n\n🎁 OFERTA ESPECIAL: Consulta gratuita este mes\n\n👉 Haz clic ahora y transforma tu negocio`
    },
    proposal: {
      short: `Propuesta: ${topic}\n\nCliente: ${clientName}\n\nResumen de nuestra solución para ${productType}.`,
      medium: `# Propuesta Comercial\n\n**Cliente:** ${clientName}\n**Tema:** ${topic}\n**Fecha:** ${new Date().toLocaleDateString()}\n\n## Resumen Ejecutivo\n\nEn ${companyName}, hemos diseñado una solución personalizada para abordar ${topic}.\n\n## Nuestra Propuesta\n\n${productType} incluye:\n- Análisis inicial\n- Implementación\n- Soporte continuo\n\n## Próximos Pasos\n\n1. Revisión de propuesta\n2. Reunión de clarificación\n3. Inicio del proyecto`,
      long: `# Propuesta Comercial Detallada\n\n---\n\n**Preparado para:** ${clientName}\n**Preparado por:** ${companyName}\n**Fecha:** ${new Date().toLocaleDateString()}\n**Referencia:** ${topic}\n\n---\n\n## Resumen Ejecutivo\n\nGracias por considerar a ${companyName} como su socio estratégico. Esta propuesta detalla nuestra solución integral para ${topic}.\n\n## Entendimiento de sus Necesidades\n\nBasado en nuestras conversaciones, entendemos que busca:\n- Optimización de procesos\n- Mejora en resultados\n- Soluciones escalables\n\n## Nuestra Solución\n\n### Fase 1: Diagnóstico\n- Análisis de situación actual\n- Identificación de oportunidades\n\n### Fase 2: Implementación\n- Desarrollo de ${productType}\n- Capacitación del equipo\n\n### Fase 3: Optimización\n- Monitoreo continuo\n- Ajustes y mejoras\n\n## Inversión\n\nNuestra propuesta incluye todos los elementos necesarios para el éxito de su proyecto.\n\n## ¿Por qué ${companyName}?\n\n- Experiencia comprobada\n- Equipo dedicado\n- Resultados garantizados\n\n## Próximos Pasos\n\nEstamos listos para comenzar. ¿Agendamos una reunión esta semana?`
    },
    followup: {
      short: `Hola ${clientName}, ¿cómo vas con la decisión sobre ${topic}? Estoy aquí para ayudarte.`,
      medium: `Hola ${clientName},\n\nEspero que estés bien. Quería dar seguimiento a nuestra conversación sobre ${topic}.\n\n¿Has tenido oportunidad de revisar la información que compartí? Estoy disponible para resolver cualquier duda.\n\nSaludos,\n${companyName}`,
      long: `Estimado/a ${clientName},\n\nEspero que este mensaje te encuentre muy bien. Me pongo en contacto para dar seguimiento a nuestra conversación sobre ${topic}.\n\nEntiendo que estas decisiones requieren tiempo y consideración cuidadosa. Por eso, quería recordarte algunos puntos clave:\n\n1. Los beneficios específicos de ${productType}\n2. Cómo se adapta a tu situación particular\n3. El soporte que recibirás de nuestro equipo\n\n¿Te gustaría programar una llamada breve para resolver cualquier pregunta que pueda haber surgido?\n\nQuedo a tu disposición.\n\nSaludos cordiales,\nEquipo ${companyName}`
    },
    objection_response: {
      short: `Entiendo tu preocupación sobre ${topic}. Déjame explicarte cómo podemos abordarla.`,
      medium: `Gracias por compartir tu inquietud sobre ${topic}.\n\nEs una pregunta muy válida que muchos de nuestros clientes han tenido. Aquí está cómo lo abordamos:\n\n1. Entendemos tu situación específica\n2. Ofrecemos soluciones flexibles\n3. Garantizamos resultados\n\n¿Te gustaría que exploremos las opciones juntos?`,
      long: `Agradezco mucho que hayas compartido tu preocupación sobre ${topic}. Es exactamente el tipo de consideración cuidadosa que demuestra que estás tomando esta decisión en serio.\n\nPermíteme abordar esto directamente:\n\n**Tu preocupación:** ${topic}\n\n**Nuestra respuesta:**\n\nEn ${companyName}, hemos trabajado con muchos clientes que tenían inquietudes similares. Aquí está lo que hemos aprendido:\n\n1. **Flexibilidad**: Adaptamos ${productType} a tu situación específica\n2. **Garantías**: Ofrecemos compromisos concretos de resultados\n3. **Soporte**: Nuestro equipo está contigo en cada paso\n\n**Casos similares:**\n\nClientes con preocupaciones parecidas han logrado excelentes resultados porque...\n\n¿Podemos agendar una llamada para explorar cómo podemos adaptar nuestra solución a tus necesidades específicas?\n\nEstoy aquí para ayudarte a tomar la mejor decisión.\n\nSaludos,\nEquipo ${companyName}`
    }
  }

  const lengthKey = length || 'medium'
  const contentTemplate = templates[content_type]?.[lengthKey] || templates.email[lengthKey]

  return contentTemplate
}
