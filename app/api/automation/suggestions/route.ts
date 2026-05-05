import { NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";
import { listPendingSuggestions } from "../../../../src/lib/automation/automationService";

export async function GET() {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suggestions = await listPendingSuggestions(userId, supabase);
  return NextResponse.json({ suggestions });
}
