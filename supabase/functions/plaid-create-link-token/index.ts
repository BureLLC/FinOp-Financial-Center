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
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { user_id } = body

    if (!user_id || user_id !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), { status: 403, headers: corsHeaders })
    }

    const plaidClientId = Deno.env.get("PLAID_CLIENT_ID")?.trim()
    const plaidSecret = Deno.env.get("PLAID_SECRET")?.trim()

    console.log("CLIENT_ID first 8 chars:", plaidClientId?.substring(0, 8))
    console.log("SECRET first 8 chars:", plaidSecret?.substring(0, 8))
    console.log("CLIENT_ID length:", plaidClientId?.length)
    console.log("SECRET length:", plaidSecret?.length)

    if (!plaidClientId || !plaidSecret) {
      return new Response(JSON.stringify({ error: "Plaid credentials not configured" }), { status: 500, headers: corsHeaders })
    }

    const response = await fetch("https://production.plaid.com/link/token/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        user: { client_user_id: user.id },
        client_name: "FinOps Financial Center",
        products: ["transactions", "investments", "liabilities"],
        country_codes: ["US"],
        language: "en",
        redirect_uri: "https://finopsfinancialcenter.vercel.app/oauth-redirect",
      }),
    })

    const data = await response.json()
    console.log("Plaid response status:", response.status)
    console.log("Plaid response:", JSON.stringify(data))

    return new Response(JSON.stringify(data), { status: response.status, headers: corsHeaders })

  } catch (err) {
    console.error("Function error:", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
