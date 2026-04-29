import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://finopsfinancialcenter.vercel.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Content-Type": "application/json",
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: CORS_HEADERS })
}

async function generateSignature(consumerKey: string, path: string, query: string, content: unknown): Promise<string> {
  const sigObject = { content, path, query }
  const sigContent = JSON.stringify(sigObject)
  const encodedKey = encodeURI(consumerKey)
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    "raw", encoder.encode(encodedKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(sigContent))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

async function snapTradeRequest(method: string, clientId: string, consumerKey: string, path: string, queryParams: Record<string, string>, content: unknown) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const allParams = new URLSearchParams({ clientId, timestamp, ...queryParams })
  const queryString = allParams.toString()
  const signature = await generateSignature(consumerKey, path, queryString, content)
  const url = `https://api.snaptrade.com${path}?${queryString}`
  console.log(method, path)
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "Signature": signature },
    body: content ? JSON.stringify(content) : undefined,
  })
  const text = await response.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  console.log("Status:", response.status, "Response:", JSON.stringify(data))
  return { ok: response.ok, data, status: response.status }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing authorization header" }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const clientId = Deno.env.get("SNAPTRADE_CLIENT_ID")!
    const consumerKey = Deno.env.get("SNAPTRADE_CONSUMER_KEY")!

    if (!clientId || !consumerKey) return json({ error: "SnapTrade credentials not configured" }, 500)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: "Unauthorized" }, 401)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()
    const action = body?.action ?? "register"
    const snapUserId = user.id

    console.log("Action:", action, "userId:", snapUserId)

    if (action === "register") {
      // Check DB for valid stored userSecret
      const { data: existingConn } = await supabase
        .from("integration_connections")
        .select("id, config")
        .eq("user_id", user.id)
        .eq("provider", "snaptrade")
        .maybeSingle()

      const storedSecret = (existingConn?.config as Record<string, unknown>)?.userSecret as string | undefined

      // Validate stored secret if exists
      if (storedSecret) {
        const validateResult = await snapTradeRequest("GET", clientId, consumerKey,
          "/api/v1/accounts", { userId: snapUserId, userSecret: storedSecret }, null)
        if (validateResult.ok) {
          console.log("Stored userSecret is valid — reusing")
          return json({ success: true, userId: snapUserId, userSecret: storedSecret })
        }
        console.log("Stored userSecret invalid — will re-register")
      }

      // Delete existing SnapTrade user and re-register
      await snapTradeRequest("DELETE", clientId, consumerKey,
        "/api/v1/snapTrade/deleteUser", { userId: snapUserId }, null)

      await new Promise(r => setTimeout(r, 1000))

      const regResult = await snapTradeRequest("POST", clientId, consumerKey,
        "/api/v1/snapTrade/registerUser", {}, { userId: snapUserId })

      const d = regResult.data as Record<string, unknown>
      if (!regResult.ok) {
        return json({ error: "Registration failed", details: d }, 500)
      }

      const userSecret = d?.userSecret as string
      if (!userSecret) return json({ error: "No userSecret returned" }, 500)

      console.log("New userSecret obtained:", userSecret)

      // Store in DB — upsert on user_id+provider
      const connData = {
        user_id: user.id,
        provider: "snaptrade",
        provider_name: "SnapTrade",
        institution_name: "Investments",
        status: "pending",
        connection_status: "pending",
        sync_status: "never",
        config: { userSecret, snapTradeUserId: snapUserId },
        updated_at: new Date().toISOString(),
      }

      if (existingConn?.id) {
        await supabase.from("integration_connections").update(connData).eq("id", existingConn.id)
      } else {
        await supabase.from("integration_connections").insert({ ...connData, created_at: new Date().toISOString() })
      }

      return json({ success: true, userId: snapUserId, userSecret })
    }

    if (action === "portal") {
      const { userSecret } = body
      if (!userSecret) return json({ error: "Missing userSecret" }, 400)

      const result = await snapTradeRequest("POST", clientId, consumerKey,
        "/api/v1/snapTrade/login",
        { userId: snapUserId, userSecret },
        { customRedirect: "https://finopsfinancialcenter.vercel.app/dashboard/connections" }
      )

      if (!result.ok) return json({ error: "Portal failed", details: result.data }, 500)
      const d = result.data as Record<string, unknown>
      const redirectURL = d?.redirectURI ?? d?.loginLink ?? d?.url ?? d?.redirectUrl
      if (!redirectURL) return json({ error: "No redirect URL", details: d }, 500)
      return json({ redirectURL })
    }

    return json({ error: "Invalid action" }, 400)

  } catch (err) {
    console.error("Error:", err)
    return json({ error: String(err) }, 500)
  }
})
