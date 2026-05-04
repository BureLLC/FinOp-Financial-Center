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

async function snapTradeGet(clientId: string, consumerKey: string, path: string, queryParams: Record<string, string>) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const allParams = new URLSearchParams({ clientId, timestamp, ...queryParams })
  const queryString = allParams.toString()
  const signature = await generateSignature(consumerKey, path, queryString, null)
  const url = `https://api.snaptrade.com${path}?${queryString}`
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", "Signature": signature },
  })
  const text = await response.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  console.log(`GET ${path} status:`, response.status)
  return { ok: response.ok, data, status: response.status }
}

async function snapTradeGetPositions(clientId: string, consumerKey: string, accountId: string, queryParams: Record<string, string>) {
  return snapTradeGet(clientId, consumerKey, `/api/v1/accounts/${accountId}/positions`, queryParams)
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: "Unauthorized" }, 401)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()
    const { authorizationId } = body
    const snapUserId = user.id

    // Get userSecret from DB
    const { data: storedConn } = await supabase
      .from("integration_connections")
      .select("id, config")
      .eq("user_id", user.id)
      .eq("provider", "snaptrade")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const userSecret = (storedConn?.config as Record<string, unknown>)?.userSecret as string
    if (!userSecret) return json({ error: "No userSecret found in DB" }, 400)

    console.log("SnapTrade sync for user:", snapUserId, "authId:", authorizationId)

    // Get all accounts — balance is included in the response
    const acctResult = await snapTradeGet(clientId, consumerKey, "/api/v1/accounts", {
      userId: snapUserId, userSecret,
    })

    if (!acctResult.ok) {
      return json({ error: "Failed to fetch accounts", details: acctResult.data }, 500)
    }

    const accounts = Array.isArray(acctResult.data) ? acctResult.data : []
    console.log(`Fetched ${accounts.length} accounts`)

    if (accounts.length === 0) {
      return json({ success: true, message: "No accounts found", accountsCount: 0 })
    }

    // Get institution name from first account
    const firstAcct = accounts[0] as Record<string, unknown>
    const institutionName = firstAcct?.institution_name as string ?? "Brokerage"

    // Find or create the connection record
    let connectionId = storedConn?.id
    if (!connectionId) {
      const { data: newConn } = await supabase
        .from("integration_connections")
        .insert({
          user_id: user.id,
          provider: "snaptrade",
          provider_name: "SnapTrade",
          institution_name: institutionName,
          status: "active",
          connection_status: "active",
          sync_status: "synced",
          external_id: authorizationId ?? null,
          config: { userSecret, snapTradeUserId: snapUserId },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id").single()
      connectionId = newConn?.id
    } else {
      // Update existing connection with correct institution name
      await supabase.from("integration_connections").update({
        institution_name: institutionName,
        status: "active",
        connection_status: "active",
        sync_status: "synced",
        external_id: authorizationId ?? null,
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", connectionId)
    }

    // Save each account
    for (const acct of accounts) {
      const a = acct as Record<string, unknown>
      const acctId = a?.id as string
      if (!acctId) continue

      // Balance is in account.balance.total.amount
      const balanceObj = (a?.balance as Record<string, unknown>)?.total as Record<string, unknown>
      const currentBalance = (balanceObj?.amount as number) ?? 0
      const currency = (balanceObj?.currency as string) ?? "USD"

      const acctName = a?.name as string ?? "Investment Account"
      const mask = (a?.number as string)?.replace(/\*/g, "").slice(-4) ?? null
      const rawType = a?.raw_type as string ?? null
      const acctStatus = a?.status as string ?? "open"

      // Skip closed accounts with $0
      if (acctStatus === "closed" && currentBalance === 0) continue

      const { data: existingAcct } = await supabase
        .from("financial_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", "snaptrade")
        .eq("provider_account_id", acctId)
        .maybeSingle()

      const acctRecord = {
        user_id: user.id,
        integration_connection_id: connectionId,
        provider: "snaptrade",
        provider_account_id: acctId,
        account_name: acctName,
        account_type: "investment",
        account_subtype: rawType,
        account_currency: currency.substring(0, 3),
        is_crypto: false,
        current_balance: currentBalance,
        available_balance: currentBalance,
        balance_source_type: "snaptrade",
        last_balance_sync_at: new Date().toISOString(),
        tax_treatment: "taxable",
        is_business_account: false,
        is_active: true,
        is_archived: false,
        institution_name: institutionName,
        mask,
        metadata: { raw_type: rawType, institution_account_id: a?.institution_account_id },
        updated_at: new Date().toISOString(),
      }

      if (existingAcct) {
        await supabase.from("financial_accounts").update(acctRecord).eq("id", existingAcct.id)
      } else {
        await supabase.from("financial_accounts").insert({ ...acctRecord, created_at: new Date().toISOString() })
      }


      const { data: resolvedAccount } = await supabase
        .from("financial_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", "snaptrade")
        .eq("provider_account_id", acctId)
        .single()

      if (!resolvedAccount) continue
      const financialAccountId = resolvedAccount.id

      // Get positions for this account
      const posResult = await snapTradeGetPositions(clientId, consumerKey, acctId, {
        userId: snapUserId, userSecret,
      })

      const positions = Array.isArray(posResult.data) ? posResult.data : []
      for (const pos of positions) {
        const p = pos as Record<string, unknown>
        const symbolObj = p?.symbol as Record<string, unknown>
        const symbol = symbolObj?.symbol as string ?? "UNKNOWN"
        const description = symbolObj?.description as string ?? symbol
        const quantity = p?.units as number ?? 0
        const price = p?.price as number ?? 0
        const marketValue = (p?.market_value as number) ?? (quantity * price)
        const bookValue = (p?.book_value as number) ?? 0
        const unrealizedGain = marketValue - bookValue

        const { data: existingPos } = await supabase
          .from("positions")
          .select("id")
          .eq("user_id", user.id)
          .eq("financial_account_id", financialAccountId)
          .eq("asset_symbol", symbol)
          .maybeSingle()

        const posRecord = {
          user_id: user.id,
          financial_account_id: financialAccountId,
          asset_symbol: symbol,
          asset_name: description,
          asset_type: "equity",
          currency: currency.substring(0, 3),
          calculated_quantity: quantity,
          average_cost_basis: quantity > 0 ? bookValue / quantity : 0,
          total_cost_basis: bookValue,
          last_price: price,
          last_valuation: marketValue,
          unrealized_gain: unrealizedGain,
          is_short: false,
          last_calculated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (existingPos) {
          await supabase.from("positions").update(posRecord).eq("id", existingPos.id)
        } else {
          await supabase.from("positions").insert({ ...posRecord, created_at: new Date().toISOString() })
        }
      }
    }

    return json({ success: true, institutionName, accountsCount: accounts.length })

  } catch (err) {
    console.error("snaptrade-sync error:", err)
    return json({ error: String(err) }, 500)
  }
})
