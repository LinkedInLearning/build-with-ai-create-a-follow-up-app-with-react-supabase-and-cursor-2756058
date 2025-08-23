import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Email service configuration (you can replace with your preferred email service)
const EMAIL_SERVICE_CONFIG = {
  apiKey: Deno.env.get('EMAIL_SERVICE_API_KEY') || '',
  apiUrl: Deno.env.get('EMAIL_SERVICE_URL') || 'https://api.resend.com/emails',
  fromEmail: Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('PROJECT_URL')!
    const supabaseServiceKey = Deno.env.get('PROJECT_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get batch size from request or use default
    const { batchSize = 10 } = await req.json().catch(() => ({ batchSize: 10 }))

    console.log(`Processing email queue with batch size: ${batchSize}`)

    // Get pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase
      .rpc('get_pending_emails', { p_batch_size: batchSize })

    if (queueError) {
      console.error('Error fetching pending emails:', queueError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending emails', details: queueError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No pending emails to process',
          processed: 0,
          successful: 0,
          failed: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${pendingEmails.length} pending emails to process`)

    const results = {
      processed: pendingEmails.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each email in the batch
    for (const email of pendingEmails) {
      try {
        console.log(`Processing email ${email.id} to ${email.recipient_email}`)
        
        // Send email using your preferred email service
        const emailSent = await sendEmail(email)
        
        if (emailSent) {
          // Mark as sent
          await supabase.rpc('mark_email_sent', { p_email_id: email.id })
          results.successful++
          
          // Log audit event
          await supabase.rpc('log_audit_event', {
            p_user_id: email.user_id,
            p_role: 'system',
            p_action: 'email_sent',
            p_table_name: 'email_queue',
            p_lead_id: email.lead_id,
            p_additional_data: {
              email_id: email.id,
              recipient: email.recipient_email,
              email_type: email.email_type,
              subject: email.subject
            }
          })
          
          console.log(`✅ Email ${email.id} sent successfully`)
        } else {
          throw new Error('Email service returned failure')
        }
        
      } catch (error) {
        console.error(`❌ Failed to send email ${email.id}:`, error)
        
        // Mark as failed
        await supabase.rpc('mark_email_failed', { 
          p_email_id: email.id, 
          p_error_message: error.message 
        })
        
        results.failed++
        results.errors.push(`Email ${email.id}: ${error.message}`)
      }
    }

    console.log(`Email queue processing complete: ${results.successful} sent, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Email queue processing complete',
        ...results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to send email (replace with your preferred email service)
async function sendEmail(email: any): Promise<boolean> {
  try {
    // Example using Resend (you can replace with SendGrid, Mailgun, etc.)
    const response = await fetch(EMAIL_SERVICE_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_SERVICE_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_SERVICE_CONFIG.fromEmail,
        to: email.recipient_email,
        subject: email.subject,
        html: email.body,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Email service error: ${errorData.message || response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}
