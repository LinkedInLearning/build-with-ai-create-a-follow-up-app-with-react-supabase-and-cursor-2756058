import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Email service configuration for Resend
const EMAIL_SERVICE_CONFIG = {
  apiKey: Deno.env.get("RESEND_API_KEY") || "",
  apiUrl: Deno.env.get("EMAIL_SERVICE_URL") || "https://api.resend.com/emails",
  fromEmail: Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com",
};

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

    // Parse request body to get leadId and template
    const { leadId, template } = await req.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!template) {
      return new Response(JSON.stringify({ error: "template is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the lead's email and name from the leads table
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("email, name")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({
          error: "Lead not found",
          details: leadError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!lead.email) {
      return new Response(
        JSON.stringify({ error: "Lead does not have an email address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    `);

    // Send follow-up email via Resend
    const emailSent = await sendFollowUpEmail(lead.email, lead.name, template);

    if (emailSent) {
      // Create or update follow-up record
      const { error: followUpError } = await supabase
        .from("followups")
        .upsert({
          lead_id: leadId,
          sent_at: new Date().toISOString(),
          template: template,
          status: "done",
        });

      if (followUpError) {
        console.error("Error creating follow-up record:", followUpError);
        // Don't fail the email sending if follow-up record creation fails
      }

      // Log audit event
      await supabase.rpc("log_audit_event", {
        p_user_id: null, // System action
        p_role: "system",
        p_action: "followup_email_sent",
        p_table_name: "leads",
        p_lead_id: leadId,
        p_additional_data: {
          recipient_email: lead.email,
          recipient_name: lead.name,
          email_type: "followup",
          template: template,
        },
      });

      return new Response(JSON.stringify({ status: "sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Failed to send follow-up email");
    }
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

// Function to send follow-up email via Resend
async function sendFollowUpEmail(
  recipientEmail: string,
  recipientName: string,
  template: string
): Promise<boolean> {
  try {
    const response = await fetch(EMAIL_SERVICE_CONFIG.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_SERVICE_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_SERVICE_CONFIG.fromEmail,
        to: recipientEmail,
        subject: `Follow-up: ${template}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hello ${recipientName},</h2>
            <p style="color: #666; line-height: 1.6;">
              ${getTemplateContent(template)}
            </p>
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              Your Team
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Resend API error: ${errorData.message || response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Function to get template content based on template name
function getTemplateContent(template: string): string {
  switch (template.toLowerCase()) {
    case "welcome":
      return `
        Thank you for your interest in our services! We're excited to have you on board.
        <br><br>
        Our team will be reaching out to you shortly to discuss your needs and how we can best serve you.
        <br><br>
        In the meantime, if you have any questions, please don't hesitate to contact us.
      `;
    
    case "check-in":
      return `
        We wanted to check in and see how things are going with your request.
        <br><br>
        Is there anything specific you'd like to discuss or any questions you might have?
        <br><br>
        We're here to help and want to ensure you're getting the support you need.
      `;
    
    case "reminder":
      return `
        This is a friendly reminder about your recent inquiry.
        <br><br>
        We haven't heard back from you and wanted to make sure everything is going well.
        <br><br>
        Please let us know if you need any assistance or have any updates.
      `;
    
    case "update":
      return `
        We have an important update regarding your request.
        <br><br>
        Our team has been working on your case and we wanted to keep you informed of the latest developments.
        <br><br>
        We'll continue to keep you updated as we make progress.
      `;
    
    default:
      return `
        Thank you for your continued interest in our services.
        <br><br>
        We appreciate your patience and look forward to assisting you further.
        <br><br>
        If you have any questions or need additional information, please don't hesitate to reach out.
      `;
  }
}
