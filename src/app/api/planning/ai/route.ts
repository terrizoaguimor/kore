import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Planning suggestions based on time of year
const seasonalSuggestions: Record<string, string[]> = {
  enero: [
    "Definir objetivos anuales y KPIs",
    "Revisar y actualizar plan de marketing",
    "Planificar campanas de primer trimestre",
    "Analizar resultados del ano anterior",
  ],
  febrero: [
    "Preparar campana de San Valentin",
    "Revisar presupuesto trimestral",
    "Planificar eventos de networking",
    "Actualizar contenido web",
  ],
  marzo: [
    "Preparar cierre de Q1",
    "Planificar campanas de primavera",
    "Revisar estrategia de redes sociales",
    "Organizar reunion de equipo",
  ],
  abril: [
    "Analizar resultados Q1",
    "Planificar eventos de Pascua",
    "Actualizar catalogo de productos",
    "Revisar SEO y contenido",
  ],
  mayo: [
    "Preparar campana Dia de las Madres",
    "Planificar estrategia de verano",
    "Revisar automatizaciones de email",
    "Organizar capacitacion de equipo",
  ],
  junio: [
    "Preparar cierre de Q2",
    "Planificar campanas de verano",
    "Revisar partnerships y colaboraciones",
    "Actualizar branding si es necesario",
  ],
  julio: [
    "Analizar resultados Q2",
    "Planificar promociones de verano",
    "Revisar y optimizar procesos",
    "Preparar contenido para segundo semestre",
  ],
  agosto: [
    "Planificar regreso a clases",
    "Preparar campanas de otono",
    "Revisar inventario y ofertas",
    "Actualizar base de datos de clientes",
  ],
  septiembre: [
    "Preparar cierre de Q3",
    "Planificar Fiestas Patrias",
    "Revisar estrategia de fin de ano",
    "Organizar eventos de networking",
  ],
  octubre: [
    "Analizar resultados Q3",
    "Preparar campana de Halloween",
    "Planificar Black Friday y Cyber Monday",
    "Revisar presupuesto de fin de ano",
  ],
  noviembre: [
    "Ejecutar Black Friday y Cyber Monday",
    "Preparar campana navidena",
    "Planificar cierre de ano",
    "Revisar logros y areas de mejora",
  ],
  diciembre: [
    "Ejecutar campana navidena",
    "Preparar cierre fiscal",
    "Planificar ano nuevo",
    "Agradecer a clientes y equipo",
  ],
}

// Task improvement suggestions by category
const taskImprovements: Record<string, string[]> = {
  campaign: [
    "Definir publico objetivo y buyer persona",
    "Establecer KPIs medibles",
    "Crear calendario de contenido",
    "Preparar materiales graficos",
    "Configurar seguimiento y analytics",
  ],
  content: [
    "Investigar keywords relevantes",
    "Crear outline detallado",
    "Incluir llamados a la accion",
    "Optimizar para SEO",
    "Planificar distribucion en canales",
  ],
  social: [
    "Definir tono y voz de marca",
    "Crear plantillas reutilizables",
    "Programar publicaciones con anticipacion",
    "Planificar interaccion con comunidad",
    "Medir engagement y ajustar",
  ],
  event: [
    "Definir objetivos del evento",
    "Crear lista de invitados",
    "Preparar agenda detallada",
    "Coordinar logistica",
    "Planificar seguimiento post-evento",
  ],
  meeting: [
    "Definir agenda clara",
    "Enviar invitaciones con anticipacion",
    "Preparar materiales de presentacion",
    "Asignar roles y responsables",
    "Documentar acuerdos y siguientes pasos",
  ],
  default: [
    "Definir responsable principal",
    "Establecer fecha limite realista",
    "Dividir en subtareas manejables",
    "Identificar dependencias",
    "Planificar revision de progreso",
  ],
}

// Improve description based on context
function improveDescription(title: string, description?: string): string {
  const titleLower = title.toLowerCase()
  let improved = description || ""

  // Add context if description is short or empty
  if (!improved || improved.length < 20) {
    if (titleLower.includes("campana") || titleLower.includes("campaign")) {
      improved = `Planificar y ejecutar campana de marketing. ${improved}`.trim()
    } else if (titleLower.includes("contenido") || titleLower.includes("content")) {
      improved = `Crear contenido de valor para la audiencia. ${improved}`.trim()
    } else if (titleLower.includes("reunion") || titleLower.includes("meeting")) {
      improved = `Organizar reunion para alinear equipo y definir siguientes pasos. ${improved}`.trim()
    } else if (titleLower.includes("evento") || titleLower.includes("event")) {
      improved = `Planificar evento con objetivos claros y logistica definida. ${improved}`.trim()
    } else if (titleLower.includes("social") || titleLower.includes("redes")) {
      improved = `Gestionar presencia en redes sociales para aumentar engagement. ${improved}`.trim()
    } else {
      improved = `Tarea importante que requiere seguimiento y medicion de resultados. ${improved}`.trim()
    }
  }

  return improved
}

// Get relevant suggestions based on task title
function getSuggestions(title: string): string[] {
  const titleLower = title.toLowerCase()

  if (titleLower.includes("campana") || titleLower.includes("campaign") || titleLower.includes("marketing")) {
    return taskImprovements.campaign
  } else if (titleLower.includes("contenido") || titleLower.includes("content") || titleLower.includes("blog")) {
    return taskImprovements.content
  } else if (titleLower.includes("social") || titleLower.includes("redes") || titleLower.includes("instagram")) {
    return taskImprovements.social
  } else if (titleLower.includes("evento") || titleLower.includes("event") || titleLower.includes("webinar")) {
    return taskImprovements.event
  } else if (titleLower.includes("reunion") || titleLower.includes("meeting") || titleLower.includes("junta")) {
    return taskImprovements.meeting
  }

  return taskImprovements.default
}

// POST - AI suggestions and improvements
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, prompt, context } = body

    if (type === "suggest") {
      // Get seasonal suggestions
      const promptLower = prompt?.toLowerCase() || ""
      let suggestions: string[] = []

      // Find the month mentioned in the prompt
      for (const [month, monthSuggestions] of Object.entries(seasonalSuggestions)) {
        if (promptLower.includes(month)) {
          suggestions = monthSuggestions
          break
        }
      }

      // If no month found, use current month
      if (suggestions.length === 0) {
        const currentMonth = new Date().toLocaleString("es", { month: "long" }).toLowerCase()
        suggestions = seasonalSuggestions[currentMonth] || seasonalSuggestions.enero
      }

      // Filter out existing tasks if provided
      if (context?.existingTasks?.length > 0) {
        const existingLower = context.existingTasks.map((t: string) => t.toLowerCase())
        suggestions = suggestions.filter(
          (s) => !existingLower.some((e: string) => e.includes(s.toLowerCase().slice(0, 10)))
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          suggestions: suggestions.slice(0, 4),
        },
      })
    }

    if (type === "improve") {
      // Parse title and description from prompt
      const parts = prompt?.split(":") || []
      const title = parts[0]?.trim() || ""
      const description = parts[1]?.trim() || ""

      // Improve description
      const improved = improveDescription(title, description)

      // Get relevant suggestions
      const suggestions = getSuggestions(title)

      return NextResponse.json({
        success: true,
        data: {
          improved,
          suggestions,
        },
      })
    }

    if (type === "generate") {
      // Generate a plan based on prompt
      const { goal, duration, startDate } = context || {}

      // This would ideally use an AI model
      // For now, return a template-based plan
      const tasks = [
        {
          title: "Definir objetivos y metricas",
          description: `Establecer objetivos SMART para: ${goal || "el proyecto"}`,
          priority: "HIGH",
          category: "ADMIN",
        },
        {
          title: "Investigacion y analisis",
          description: "Analizar mercado, competencia y audiencia objetivo",
          priority: "HIGH",
          category: "ADMIN",
        },
        {
          title: "Desarrollar estrategia",
          description: "Crear plan de accion detallado con cronograma",
          priority: "MEDIUM",
          category: "CAMPAIGN",
        },
        {
          title: "Crear contenido y materiales",
          description: "Producir todos los assets necesarios",
          priority: "MEDIUM",
          category: "CONTENT",
        },
        {
          title: "Implementacion y lanzamiento",
          description: "Ejecutar el plan segun cronograma",
          priority: "HIGH",
          category: "CAMPAIGN",
        },
        {
          title: "Monitoreo y optimizacion",
          description: "Seguimiento de metricas y ajustes",
          priority: "MEDIUM",
          category: "ADMIN",
        },
      ]

      return NextResponse.json({
        success: true,
        data: {
          name: goal || "Nuevo Plan",
          description: `Plan generado para: ${goal || "objetivo general"}`,
          tasks,
        },
      })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error in AI endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
