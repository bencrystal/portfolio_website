import { createClient } from "@supabase/supabase-js";

export const scribeDb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export function validListToken(token: string | null): boolean {
  return !!token && !!process.env.LIST_TOKEN && token === process.env.LIST_TOKEN;
}
