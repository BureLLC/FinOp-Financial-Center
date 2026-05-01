import { createBrowserClient } from "@supabase/ssr";
import { createE2ESupabaseClient } from "./e2e-supabase";

const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON = "public-anon-placeholder";

export function createClient() {
  if (process.env.NEXT_PUBLIC_E2E_MODE === "true") {
    return createE2ESupabaseClient() as ReturnType<typeof createBrowserClient>;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON;

  if (typeof window !== "undefined" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in runtime environment.");
  }

  return createBrowserClient(url, anon);
}
