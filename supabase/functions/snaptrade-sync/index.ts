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
      // Account fetch failed — update connection status to reflect sync failure
      const connId = storedConn?.id
      if (connId) {
        await supabase.from("integration_connections").update({
          sync_status: "error",
          updated_at: new Date().toISOString(),
          metadata: { last_sync_error: "account_fetch_failed", last_sync_error_at: new Date().toISOString() },
        }).eq("id", connId)
      }
      return json({ error: "Failed to fetch accounts", details: acctResult.data }, 500)
    }

    const accounts = Array.isArray(acctResult.data) ? acctResult.data : []
    console.log(`Fetched ${accounts.length} accounts`)

    // Get institution name from first account (or default)
    const firstAcct = accounts.length > 0 ? accounts[0] as Record<string, unknown> : null
    const institutionName = firstAcct?.institution_name as string ?? "Brokerage"

    // Find or create the connection record — do NOT set sync_status yet; derive it after sync
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
          sync_status: "pending",
          external_id: authorizationId ?? null,
          config: { userSecret, snapTradeUserId: snapUserId },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id").single()
      connectionId = newConn?.id
    } else {
      await supabase.from("integration_connections").update({
        institution_name: institutionName,
        status: "active",
        connection_status: "active",
        sync_status: "syncing",
        external_id: authorizationId ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", connectionId)
    }

    if (accounts.length === 0) {
      // Connection exists but SnapTrade returned zero accounts — record this state
      await supabase.from("integration_connections").update({
        sync_status: "synced",
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { last_sync_result: "no_accounts_returned", last_sync_at: new Date().toISOString() },
      }).eq("id", connectionId)
      return json({
        success: true,
        message: "No accounts returned by brokerage",
        accountsCount: 0,
        syncStatus: "connected_no_accounts_returned",
      })
    }

    // Track sync results per account for final status derivation
    let totalAccountsSynced = 0
    let totalPositionsSynced = 0
    let accountsWithPositions = 0
    let accountsMissingPositions = 0
    let positionSyncErrors = 0

    // Collect synced provider_account_ids to detect stale accounts from previous syncs
    const syncedProviderAccountIds: string[] = []

    // Save each account
    for (const acct of accounts) {
      const a = acct as Record<string, unknown>
      const acctId = a?.id as string
      if (!acctId) continue

      syncedProviderAccountIds.push(acctId)

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
        // Reactivate if previously soft-deleted during reconnect
        await supabase.from("financial_accounts").update({
          ...acctRecord,
          deleted_at: null,
        }).eq("id", existingAcct.id)
      } else {
        await supabase.from("financial_accounts").insert({ ...acctRecord, created_at: new Date().toISOString() })
      }

      totalAccountsSynced++

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

      if (!posResult.ok) {
        console.error(`Position fetch failed for account ${acctId}:`, posResult.status, posResult.data)
        positionSyncErrors++
        continue
      }

      const positions = Array.isArray(posResult.data) ? posResult.data : []

      if (positions.length === 0) {
        accountsMissingPositions++
        console.log(`Account ${acctId} returned 0 positions`)
      } else {
        accountsWithPositions++
      }

      // Collect synced position symbols to detect stale positions
      const syncedSymbols: string[] = []

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

        syncedSymbols.push(symbol)

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
          await supabase.from("positions").update({ ...posRecord, deleted_at: null }).eq("id", existingPos.id)
        } else {
          await supabase.from("positions").insert({ ...posRecord, created_at: new Date().toISOString() })
        }

        totalPositionsSynced++
      }

      // Soft-delete positions for this account that were not in the latest sync
      // (e.g. sold positions no longer returned by SnapTrade)
      if (syncedSymbols.length > 0) {
        await supabase
          .from("positions")
          .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("financial_account_id", financialAccountId)
          .is("deleted_at", null)
          .not("asset_symbol", "in", `(${syncedSymbols.map(s => `"${s}"`).join(",")})`)
      }
    }

    // Soft-delete stale accounts from this connection that are no longer returned by SnapTrade
    // (e.g. user closed an account at the brokerage)
    if (syncedProviderAccountIds.length > 0) {
      const { data: allConnAccounts } = await supabase
        .from("financial_accounts")
        .select("id, provider_account_id")
        .eq("user_id", user.id)
        .eq("provider", "snaptrade")
        .eq("integration_connection_id", connectionId)
        .is("deleted_at", null)

      for (const acct of (allConnAccounts ?? [])) {
        if (!syncedProviderAccountIds.includes(acct.provider_account_id)) {
          console.log(`Soft-deleting stale account ${acct.provider_account_id}`)
          const now = new Date().toISOString()
          await supabase.from("financial_accounts").update({
            is_active: false, deleted_at: now, updated_at: now,
          }).eq("id", acct.id)
          // Also soft-delete positions for the stale account
          await supabase.from("positions").update({
            deleted_at: now, updated_at: now,
          }).eq("financial_account_id", acct.id).is("deleted_at", null)
        }
      }
    }

    // Derive final sync_status from actual sync results
    let finalSyncStatus = "synced"
    const syncMetadata: Record<string, unknown> = {
      last_sync_at: new Date().toISOString(),
      accounts_synced: totalAccountsSynced,
      positions_synced: totalPositionsSynced,
      accounts_with_positions: accountsWithPositions,
      accounts_missing_positions: accountsMissingPositions,
      position_sync_errors: positionSyncErrors,
    }

    if (positionSyncErrors > 0 && accountsWithPositions === 0) {
      finalSyncStatus = "error"
      syncMetadata.last_sync_error = "position_fetch_failed_all_accounts"
    } else if (positionSyncErrors > 0) {
      // Partial success — some accounts synced positions, some failed
      syncMetadata.last_sync_warning = "position_fetch_failed_some_accounts"
    }

    await supabase.from("integration_connections").update({
      sync_status: finalSyncStatus,
      last_synced: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: syncMetadata,
    }).eq("id", connectionId)

    return json({
      success: true,
      institutionName,
      accountsCount: totalAccountsSynced,
      positionsCount: totalPositionsSynced,
      accountsWithPositions,
      accountsMissingPositions,
      positionSyncErrors,
      syncStatus: finalSyncStatus,
    })

  } catch (err) {
    console.error("snaptrade-sync error:", err)
    return json({ error: String(err) }, 500)
  }
})
