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
