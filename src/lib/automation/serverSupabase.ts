// Server-side Supabase client for API route handlers.
// Uses createServerClient from @supabase/ssr with Next.js cookies() for session auth.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";

export async function createRouteClient(): Promise<{ supabase: SupabaseClient; userId: string | null }> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — safe to ignore
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}
