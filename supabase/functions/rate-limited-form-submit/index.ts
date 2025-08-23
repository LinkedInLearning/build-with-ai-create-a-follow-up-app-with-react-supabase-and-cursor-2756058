import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for public access
    const supabaseUrl = Deno.env.get("PROJECT_URL")!;
    const supabaseServiceKey = Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
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
    });

    // Get client IP address
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_ip_address: clientIP,
        p_threshold: 5,
        p_hours: 1,
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      return new Response(
        JSON.stringify({
          error: "Rate limit check failed",
          details: rateLimitError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If rate limit exceeded, return 429
    if (!rateLimitCheck) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          message:
            "Too many submissions from this IP address. Maximum 5 submissions per hour.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the form data
    const formData = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "source",
      "interest",
      "consent_marketing",
      "consent_privacy",
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Record the form submission for rate limiting
    const { data: submissionRecord, error: submissionError } =
      await supabase.rpc("record_form_submission", {
        p_ip_address: clientIP,
      });

    if (submissionError) {
      console.error("Submission record error:", submissionError);
      return new Response(
        JSON.stringify({ error: "Failed to record submission", details: submissionError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare lead data
    const leadData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      source:
        formData.source === "Other"
          ? formData.otherSource || "Other"
          : formData.source,
      interest: formData.interest,
      note: formData.note || null,
      consent_marketing: formData.consent_marketing,
      consent_privacy: formData.consent_privacy,
      user_agent: req.headers.get("user-agent") || null,
    };

    // Insert the lead
    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    if (insertError) {
      console.error("Lead insertion error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to submit form" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log audit event for lead creation
    if (insertedLead && insertedLead[0]) {
      await supabase.rpc("log_audit_event", {
        p_user_id: null, // Public form submission
        p_role: "public",
        p_action: "create",
        p_table_name: "leads",
        p_lead_id: insertedLead[0].id,
        p_ip_address: clientIP,
        p_user_agent: req.headers.get("user-agent"),
        p_additional_data: {
          lead_name: leadData.name,
          lead_email: leadData.email,
          source: leadData.source,
          submission_id: submissionRecord,
        },
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Your information has been submitted successfully. We'll get back to you soon!",
        lead_id: insertedLead?.[0]?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
