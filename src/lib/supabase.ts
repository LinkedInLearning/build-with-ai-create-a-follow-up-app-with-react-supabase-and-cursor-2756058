import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are missing
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
          insert: () =>
            Promise.resolve({ error: new Error("Supabase not configured") }),
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [],
                error: new Error("Supabase not configured"),
              }),
          }),
        }),
      };

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
}

export type LeadInsert = Omit<Lead, "id" | "created_at">;
