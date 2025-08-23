import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Database types for TypeScript
export interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone?: string;
  email_hash?: string;
  phone_hash?: string;
  source: string;
  interest: string;
  note?: string;
  assigned_to?: string;
  consent_marketing: boolean;
  consent_privacy: boolean;
  user_agent?: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at">;

export interface FollowUp {
  id: string;
  lead_id: string;
  sent_at: string;
  template?: string;
  status: "pending" | "in_progress" | "done";
}

export type FollowUpInsert = Omit<FollowUp, "id">;

export interface AuditLog {
  id: string;
  event_time: string;
  user_id?: string;
  role: string;
  action: string;
  table_name: string;
  lead_id?: string;
  ip_address?: string;
  user_agent?: string;
  additional_data?: Record<string, any>;
  created_at: string;
}

export type AuditLogInsert = Omit<AuditLog, "id" | "event_time" | "created_at">;

// Utility function to get leads data based on user role
export const getLeadsData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select(
        `
        id,
        roles!inner(name)
      `
      )
      .eq("user_id", user.id)
      .single();

    if (!userData) return { data: null, error: null };

    const userRole = userData.roles.name;

    // Super admin gets full data, sub admin gets hashed data
    const tableName = userRole === "super_admin" ? "leads" : "leads_hashed";

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (error) {
    console.error("Error in getLeadsData:", error);
    return { data: null, error };
  }
};

// Utility function to log audit events
export const logAuditEvent = async (
  action: string,
  tableName: string,
  leadId?: string,
  additionalData?: Record<string, any>
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get user details and role
    const { data: userData } = await supabase
      .from("users")
      .select(
        `
        id,
        roles!inner(name)
      `
      )
      .eq("user_id", user.id)
      .single();

    if (!userData) return;

    const auditData: AuditLogInsert = {
      user_id: userData.id,
      role: userData.roles.name,
      action,
      table_name: tableName,
      lead_id: leadId,
      additional_data: additionalData,
    };

    // Call the database function to log the audit event
    const { error } = await supabase.rpc("log_audit_event", {
      p_user_id: userData.id,
      p_role: userData.roles.name,
      p_action: action,
      p_table_name: tableName,
      p_lead_id: leadId,
      p_additional_data: additionalData,
    });

    if (error) {
      console.error("Error logging audit event:", error);
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
  }
};

// Utility function to create follow-ups for existing leads
export const createFollowUpsForExistingLeads = async (userId: string) => {
  try {
    // Get all leads assigned to this user
    const { data: allLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .eq("assigned_to", userId);

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return;
    }

    // Get all follow-ups for this user
    const { data: existingFollowUps, error: followUpsError } = await supabase
      .from("followups")
      .select("lead_id");

    if (followUpsError) {
      console.error("Error fetching follow-ups:", followUpsError);
      return;
    }

    // Find leads that don't have follow-ups
    const leadsWithFollowUps = new Set(
      existingFollowUps?.map((f) => f.lead_id) || []
    );
    const leadsWithoutFollowUps =
      allLeads?.filter((lead) => !leadsWithFollowUps.has(lead.id)) || [];

    if (leadsWithoutFollowUps.length > 0) {
      const newFollowUps: FollowUpInsert[] = leadsWithoutFollowUps.map(
        (lead) => ({
          lead_id: lead.id,
          sent_at: new Date().toISOString(),
          status: "pending",
          template: "Initial follow-up for assigned lead",
        })
      );

      const { error: createError } = await supabase
        .from("followups")
        .insert(newFollowUps);

      if (createError) {
        console.error(
          "Error creating follow-ups for existing leads:",
          createError
        );
      } else {
        console.log(
          "Created follow-ups for",
          newFollowUps.length,
          "existing leads"
        );
      }
    }
  } catch (error) {
    console.error("Error in createFollowUpsForExistingLeads:", error);
  }
};
