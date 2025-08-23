import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@6.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Email service configuration for Resend
const EMAIL_SERVICE_CONFIG = {
  apiKey: Deno.env.get("RESEND_API_KEY") || "",
  fromEmail: Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com",
};

// Initialize Resend client
const resend = new Resend(EMAIL_SERVICE_CONFIG.apiKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("PROJECT_URL")!;
    const supabaseServiceKey = Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get batch size from request or use default
    const { batchSize = 10 } = await req
      .json()
      .catch(() => ({ batchSize: 10 }));

    console.log(`Processing email queue with batch size: ${batchSize}`);

    // Get pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase.rpc(
      "get_pending_emails",
      { p_batch_size: batchSize }
    );

    if (queueError) {
      console.error("Error fetching pending emails:", queueError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch pending emails",
          details: queueError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No pending emails to process",
          processed: 0,
          successful: 0,
          failed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${pendingEmails.length} pending emails to process`);

    const results = {
      processed: pendingEmails.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each email in the batch
    for (const email of pendingEmails) {
      try {
        console.log(`Processing email ${email.id} to ${email.recipient_email}`);

        // Send email using Resend client
        const emailSent = await sendEmail(email, supabase);

        if (emailSent) {
          // Mark as sent
          await supabase.rpc("mark_email_sent", { p_email_id: email.id });
          results.successful++;

          // Log audit event
          await supabase.rpc("log_audit_event", {
            p_user_id: email.user_id,
            p_role: "system",
            p_action: "email_sent",
            p_table_name: "email_queue",
            p_lead_id: email.lead_id,
            p_additional_data: {
              email_id: email.id,
              recipient: email.recipient_email,
              email_type: email.email_type,
              subject: email.subject,
            },
          });

          console.log(`✅ Email ${email.id} sent successfully`);
        } else {
          throw new Error("Email service returned failure");
        }
      } catch (error) {
        console.error(`❌ Failed to send email ${email.id}:`, error);

        // Mark as failed
        await supabase.rpc("mark_email_failed", {
          p_email_id: email.id,
          p_error_message: error.message,
        });

        results.failed++;
        results.errors.push(`Email ${email.id}: ${error.message}`);
      }
    }

    console.log(
      `Email queue processing complete: ${results.successful} sent, ${results.failed} failed`
    );

    return new Response(
      JSON.stringify({
        message: "Email queue processing complete",
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to send email using Resend client
async function sendEmail(email: any, supabase: any): Promise<boolean> {
  try {
    // Get lead information for personalization
    let leadName = "there";
    if (email.lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("name")
        .eq("id", email.lead_id)
        .single();

      if (lead?.name) {
        leadName = lead.name;
      }
    }

    // Create email template based on email type
    const emailTemplate = createEmailTemplate(email.email_type, {
      recipientName: leadName,
      subject: email.subject,
      body: email.body,
      leadId: email.lead_id,
    });

    // Send email using Resend client
    const { data, error } = await resend.emails.send({
      from: EMAIL_SERVICE_CONFIG.fromEmail,
      to: email.recipient_email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Function to create email templates
function createEmailTemplate(
  emailType: string,
  data: {
    recipientName: string;
    subject: string;
    body: string;
    leadId?: string;
  }
) {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0; color: #333;">Your Request</h2>
        </div>
        <div class="content">
          <p>Hello ${data.recipientName},</p>
          ${data.body}
        </div>
        <div class="footer">
          <p>Thank you for choosing our services.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Customize template based on email type
  switch (emailType) {
    case "welcome":
      return {
        subject: "Welcome! Your request has been received",
        html: baseTemplate.replace(
          data.body,
          `
            <p>Thank you for submitting your request form!</p>
            <p>We have received your information and our team will review it shortly. 
            You can expect to hear from us within 24-48 hours.</p>
            <p>If you have any urgent questions, please don't hesitate to reach out to us.</p>
          `
        ),
      };

    case "followup":
      return {
        subject: data.subject || "Follow-up on your request",
        html: baseTemplate.replace(
          data.body,
          `
            <p>We wanted to follow up on your recent request.</p>
            <p>${data.body}</p>
            <p>We appreciate your patience and look forward to assisting you further.</p>
          `
        ),
      };

    case "notification":
      return {
        subject: data.subject || "Important Update",
        html: baseTemplate.replace(
          data.body,
          `
            <p>We have an important update regarding your request.</p>
            <p>${data.body}</p>
            <p>Please let us know if you need any clarification.</p>
          `
        ),
      };

    default:
      return {
        subject: data.subject || "Message from our team",
        html: baseTemplate.replace(data.body, `<p>${data.body}</p>`),
      };
  }
}
