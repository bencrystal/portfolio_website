import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy so importing this module never throws at build time when env vars
// are absent locally (Next collects page data by importing every route).
let client: SupabaseClient | null = null;

export const scribeDb = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false },
    });
    return Reflect.get(client, prop, client);
  },
});

export function validListToken(token: string | null): boolean {
  return !!token && !!process.env.LIST_TOKEN && token === process.env.LIST_TOKEN;
}
