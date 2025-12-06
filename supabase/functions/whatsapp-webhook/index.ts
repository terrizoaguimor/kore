// Supabase Edge Function: WhatsApp Webhook
// Path: /functions/v1/whatsapp-webhook
// Handles incoming WhatsApp Business API webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp webhook event types
interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: { name: string }
        wa_id: string
      }>
      messages?: Array<{
        from: string
        id: string
        timestamp: string
        type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive' | 'button'
        text?: { body: string }
        image?: { id: string; mime_type: string; sha256: string; caption?: string }
        video?: { id: string; mime_type: string; sha256: string; caption?: string }
        audio?: { id: string; mime_type: string; sha256: string }
        document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string }
        location?: { latitude: number; longitude: number; name?: string; address?: string }
        interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string; description: string } }
        button?: { text: string; payload: string }
        context?: { from: string; id: string }
      }>
      statuses?: Array<{
        id: string
        status: 'sent' | 'delivered' | 'read' | 'failed'
        timestamp: string
        recipient_id: string
        errors?: Array<{ code: number; title: string }>
      }>
    }
    field: string
  }>
}

interface WhatsAppWebhookBody {
  object: string
  entry: WhatsAppWebhookEntry[]
}

serve(async (req) => {
  // Handle verification request from Meta
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'kore_voice_webhook_verify'

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified!')
      return new Response(challenge, { status: 200 })
    }

    return new Response('Forbidden', { status: 403 })
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client (webhooks don't have user auth)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: WhatsAppWebhookBody = await req.json()

    // Verify this is a WhatsApp webhook
    if (body.object !== 'whatsapp_business_account') {
      return new Response('Not a WhatsApp webhook', { status: 400 })
    }

    // Process each entry
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue

        const { metadata, contacts, messages, statuses } = change.value
        const phoneNumberId = metadata.phone_number_id

        // Find the WhatsApp account
        const { data: whatsappAccount } = await supabaseAdmin
          .from('whatsapp_accounts')
          .select('id, organization_id')
          .eq('phone_number_id', phoneNumberId)
          .single()

        if (!whatsappAccount) {
          console.log(`No WhatsApp account found for phone_number_id: ${phoneNumberId}`)
          continue
        }

        // Process incoming messages
        if (messages && messages.length > 0) {
          for (const message of messages) {
            await processIncomingMessage(supabaseAdmin, whatsappAccount, message, contacts?.[0])
          }
        }

        // Process status updates
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            await processStatusUpdate(supabaseAdmin, status)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to avoid Meta retrying
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processIncomingMessage(
  supabase: ReturnType<typeof createClient>,
  whatsappAccount: { id: string; organization_id: string },
  message: WhatsAppWebhookBody['entry'][0]['changes'][0]['value']['messages'][0],
  contact?: { profile: { name: string }; wa_id: string }
) {
  const contactPhone = message.from
  const contactName = contact?.profile?.name || null

  // Find or create conversation
  let { data: conversation } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('whatsapp_account_id', whatsappAccount.id)
    .eq('contact_phone', contactPhone)
    .single()

  if (!conversation) {
    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('whatsapp_conversations')
      .insert({
        organization_id: whatsappAccount.organization_id,
        whatsapp_account_id: whatsappAccount.id,
        contact_phone: contactPhone,
        contact_name: contactName,
        status: 'active',
        window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h window
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return
    }
    conversation = newConversation
  } else {
    // Update conversation window
    await supabase
      .from('whatsapp_conversations')
      .update({
        contact_name: contactName || undefined,
        window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      })
      .eq('id', conversation.id)
  }

  // Determine message content based on type
  let content: string | null = null
  let mediaUrl: string | null = null
  let mediaMimeType: string | null = null
  let mediaFilename: string | null = null
  let mediaCaption: string | null = null

  switch (message.type) {
    case 'text':
      content = message.text?.body || null
      break
    case 'image':
      content = '[Imagen]'
      mediaMimeType = message.image?.mime_type || null
      mediaCaption = message.image?.caption || null
      // In production, download media from WhatsApp API
      break
    case 'video':
      content = '[Video]'
      mediaMimeType = message.video?.mime_type || null
      mediaCaption = message.video?.caption || null
      break
    case 'audio':
      content = '[Audio]'
      mediaMimeType = message.audio?.mime_type || null
      break
    case 'document':
      content = '[Documento]'
      mediaMimeType = message.document?.mime_type || null
      mediaFilename = message.document?.filename || null
      mediaCaption = message.document?.caption || null
      break
    case 'location':
      content = `[Ubicación: ${message.location?.name || ''} ${message.location?.address || ''}]`.trim()
      break
    case 'interactive':
      if (message.interactive?.button_reply) {
        content = message.interactive.button_reply.title
      } else if (message.interactive?.list_reply) {
        content = message.interactive.list_reply.title
      }
      break
    case 'button':
      content = message.button?.text || null
      break
  }

  // Save message
  const { error: messageError } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversation.id,
      wamid: message.id,
      direction: 'inbound',
      message_type: message.type,
      content,
      media_url: mediaUrl,
      media_mime_type: mediaMimeType,
      media_filename: mediaFilename,
      media_caption: mediaCaption,
      status: 'delivered',
      delivered_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      reply_to_message_id: message.context?.id ? await findMessageByWamid(supabase, message.context.id) : null
    })

  if (messageError) {
    console.error('Error saving message:', messageError)
  }

  // Check for auto-reply settings
  const { data: account } = await supabase
    .from('whatsapp_accounts')
    .select('settings')
    .eq('id', whatsappAccount.id)
    .single()

  if (account?.settings?.autoReply && account?.settings?.welcomeMessage) {
    // Check if this is a new conversation (first message)
    const { count } = await supabase
      .from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)

    if (count === 1) {
      // Send auto-reply (in production, call WhatsApp API)
      console.log('Would send auto-reply:', account.settings.welcomeMessage)
    }
  }
}

async function processStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  status: WhatsAppWebhookBody['entry'][0]['changes'][0]['value']['statuses'][0]
) {
  const updateData: Record<string, unknown> = {
    status: status.status
  }

  switch (status.status) {
    case 'sent':
      updateData.sent_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
      break
    case 'delivered':
      updateData.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
      break
    case 'read':
      updateData.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
      break
    case 'failed':
      if (status.errors && status.errors.length > 0) {
        updateData.error_code = status.errors[0].code.toString()
        updateData.error_message = status.errors[0].title
      }
      break
  }

  const { error } = await supabase
    .from('whatsapp_messages')
    .update(updateData)
    .eq('wamid', status.id)

  if (error) {
    console.error('Error updating message status:', error)
  }
}

async function findMessageByWamid(
  supabase: ReturnType<typeof createClient>,
  wamid: string
): Promise<string | null> {
  const { data } = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('wamid', wamid)
    .single()

  return data?.id || null
}
