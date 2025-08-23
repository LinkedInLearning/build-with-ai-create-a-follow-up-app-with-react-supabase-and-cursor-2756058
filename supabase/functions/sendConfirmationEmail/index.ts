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

    // Parse request body to get leadId
    const { leadId } = await req.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId is required" }), {
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

    // Send confirmation email via Resend
    const emailSent = await sendConfirmationEmail(lead.email, lead.name);

    if (emailSent) {
      // Log audit event
      await supabase.rpc("log_audit_event", {
        p_user_id: null, // System action
        p_role: "system",
        p_action: "confirmation_email_sent",
        p_table_name: "leads",
        p_lead_id: leadId,
        p_additional_data: {
          recipient_email: lead.email,
          recipient_name: lead.name,
          email_type: "confirmation",
        },
      });

      return new Response(JSON.stringify({ status: "sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Failed to send confirmation email");
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

// Function to send confirmation email via Resend
async function sendConfirmationEmail(
  recipientEmail: string,
  recipientName: string
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
        subject: "Thank you for your request!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for submitting this request form, ${recipientName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              We have received your request and our team will review it shortly. 
              You can expect to hear from us within 24-48 hours.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you have any urgent questions, please don't hesitate to reach out to us.
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
