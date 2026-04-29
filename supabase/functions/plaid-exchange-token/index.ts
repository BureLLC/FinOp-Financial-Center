import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://finopsfinancialcenter.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { public_token, institution_name, institution_id } = body

    if (!public_token || typeof public_token !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid public_token" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const plaidResponse = await fetch(
      "https://production.plaid.com/item/public_token/exchange",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: Deno.env.get("PLAID_CLIENT_ID"),
          secret: Deno.env.get("PLAID_SECRET"),
          public_token,
        }),
      }
    )

    const plaidData = await plaidResponse.json()

    if (!plaidResponse.ok || !plaidData.access_token) {
      return new Response(
        JSON.stringify({
          error: "Plaid token exchange failed",
          details: plaidData,
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    const access_token: string = plaidData.access_token
    const item_id: string = plaidData.item_id

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: existing, error: selectError } = await supabaseAdmin
      .from("integration_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "plaid")
      .eq("external_id", item_id)
      .maybeSingle()

    if (selectError) {
      throw new Error(`DB select failed: ${selectError.message}`)
    }

    let connectionId: string

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("integration_connections")
        .update({
          access_token_encrypted: access_token,
          institution_name: institution_name ?? null,
          status: "active",
          connection_status: "active",
          sync_status: "pending",
          connection_metadata: {
            institution_id: institution_id ?? null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`)
      }

      connectionId = existing.id

    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("integration_connections")
        .insert({
          user_id: user.id,
          provider: "plaid",
          provider_name: "plaid",
          institution_name: institution_name ?? null,
          external_id: item_id,
          access_token_encrypted: access_token,
          status: "active",
          connection_status: "active",
          sync_status: "pending",
          config: {},
          connection_metadata: {
            institution_id: institution_id ?? null,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (insertError || !inserted) {
        throw new Error(
          `DB insert failed: ${insertError?.message ?? "No row returned"}`
        )
      }

      connectionId = inserted.id
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection_id: connectionId,
        item_id,
      }),
      { headers: corsHeaders }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "plaid-exchange-token failed",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
