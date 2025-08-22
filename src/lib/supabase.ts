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
