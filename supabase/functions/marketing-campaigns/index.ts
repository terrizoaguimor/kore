// Supabase Edge Function: Marketing Campaigns API
// Path: /functions/v1/marketing-campaigns

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user's organization
    const { data: membership, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'User not part of any organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const campaignId = pathParts[pathParts.length - 1]
    const isAnalytics = url.pathname.includes('/analytics')

    // Route based on method
    switch (req.method) {
      case 'GET':
        if (isAnalytics && campaignId && campaignId !== 'marketing-campaigns') {
          return await getCampaignAnalytics(supabaseClient, membership.organization_id, campaignId.replace('/analytics', ''))
        }
        if (campaignId && campaignId !== 'marketing-campaigns') {
          return await getCampaign(supabaseClient, membership.organization_id, campaignId)
        }
        return await listCampaigns(supabaseClient, membership.organization_id, url.searchParams)

      case 'POST':
        return await createCampaign(supabaseClient, membership.organization_id, user.id, await req.json())

      case 'PUT':
      case 'PATCH':
        if (!campaignId || campaignId === 'marketing-campaigns') {
          return new Response(
            JSON.stringify({ error: 'Campaign ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await updateCampaign(supabaseClient, membership.organization_id, campaignId, await req.json())

      case 'DELETE':
        if (!campaignId || campaignId === 'marketing-campaigns') {
          return new Response(
            JSON.stringify({ error: 'Campaign ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await deleteCampaign(supabaseClient, membership.organization_id, campaignId)

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function listCampaigns(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  params: URLSearchParams
) {
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '10')
  const status = params.get('status')
  const type = params.get('type')
  const search = params.get('search')

  let query = supabase
    .from('marketing_campaigns')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      campaigns: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCampaign(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  campaignId: string
) {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: 'Campaign not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createCampaign(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  userId: string,
  body: Record<string, unknown>
) {
  const { name, description, type, status, start_date, end_date, target_audience, budget, goals, content, settings } = body

  if (!name || !type) {
    return new Response(
      JSON.stringify({ error: 'Name and type are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      name,
      description,
      type,
      status: status || 'draft',
      start_date,
      end_date,
      target_audience: target_audience || {},
      budget: budget || 0,
      goals: goals || {},
      content: content || {},
      settings: settings || {},
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        leads: 0,
        conversions: 0
      }
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(data),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateCampaign(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  campaignId: string,
  body: Record<string, unknown>
) {
  // Remove fields that shouldn't be updated
  const { id, organization_id, campaign_no, created_at, created_by, ...updateData } = body

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Campaign not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteCampaign(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  campaignId: string
) {
  // Soft delete
  const { error } = await supabase
    .from('marketing_campaigns')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('organization_id', organizationId)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(null, { status: 204, headers: corsHeaders })
}

async function getCampaignAnalytics(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  campaignId: string
) {
  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single()

  if (error || !campaign) {
    return new Response(
      JSON.stringify({ error: 'Campaign not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const metrics = campaign.metrics || {}
  const goals = campaign.goals || {}
  const budget = campaign.budget || 0

  // Calculate rates
  const openRate = metrics.sent > 0 ? (metrics.opened / metrics.sent) * 100 : 0
  const clickRate = metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0
  const conversionRate = metrics.leads > 0 ? (metrics.conversions / metrics.leads) * 100 : 0
  const costPerLead = budget > 0 && metrics.leads > 0 ? budget / metrics.leads : 0
  const roi = goals.revenue && budget > 0 ? ((goals.revenue - budget) / budget) * 100 : 0

  // Get recipient stats
  const { data: recipientStats } = await supabase
    .from('campaign_recipients')
    .select('status')
    .eq('campaign_id', campaignId)

  const statusCounts = (recipientStats || []).reduce((acc: Record<string, number>, r: { status: string }) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return new Response(
    JSON.stringify({
      campaignId,
      campaignName: campaign.name,
      campaignType: campaign.type,
      status: campaign.status,
      metrics,
      performance: {
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        costPerLead: Math.round(costPerLead * 100) / 100,
        roi: Math.round(roi * 100) / 100
      },
      goals,
      progress: {
        leadsProgress: goals.leads ? Math.round((metrics.leads / goals.leads) * 100) : 0,
        conversionsProgress: goals.conversions ? Math.round((metrics.conversions / goals.conversions) * 100) : 0,
        revenueProgress: goals.revenue ? Math.round((metrics.conversions * (budget / (metrics.conversions || 1))) / goals.revenue * 100) : 0
      },
      recipientStats: statusCounts,
      budget,
      dates: {
        start: campaign.start_date,
        end: campaign.end_date
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
