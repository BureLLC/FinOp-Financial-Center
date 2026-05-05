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
  console.log(`[snaptrade-sync] GET ${path} → HTTP ${response.status}`)
  return { ok: response.ok, data, status: response.status }
}

async function snapTradeGetPositions(clientId: string, consumerKey: string, accountId: string, queryParams: Record<string, string>) {
  return snapTradeGet(clientId, consumerKey, `/api/v1/accounts/${accountId}/positions`, queryParams)
}

interface AccountBreakdown {
  snaptradeAccountId: string
  name: string
  type: string | null
  mask: string | null
  balance: number
  skipped: boolean
  skipReason: string | null
  dbAction: "inserted" | "updated" | "error" | "skipped"
  dbError: string | null
  positionsCount: number
  positionsSyncStatus: "ok" | "empty" | "error" | "skipped"
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
    const body = await req.json().catch(() => ({}))
    // authorizationId — present on first-time connect (from OAuth redirect)
    // connectionId    — present on re-sync (from "Sync Now" button), identifies which connection to sync
    const { authorizationId, connectionId: bodyConnectionId } = body
    const snapUserId = user.id

    console.log(`[snaptrade-sync] Starting sync | user: ${snapUserId.slice(0, 8)}... | authorizationId: ${authorizationId ?? "(none)"} | connectionId: ${bodyConnectionId ?? "(none — will pick latest)"}`)

    // Fetch stored connection — no status filter so reconnect / re-sync can reactivate.
    // If a specific connectionId was provided (re-sync button), use it; otherwise pick latest.
    let connQuery = supabase
      .from("integration_connections")
      .select("id, config, status, institution_name, external_id")
      .eq("user_id", user.id)
      .eq("provider", "snaptrade")

    if (bodyConnectionId) {
      connQuery = connQuery.eq("id", bodyConnectionId)
    } else {
      connQuery = connQuery.order("created_at", { ascending: false }).limit(1)
    }

    const { data: storedConn, error: connLookupErr } = await connQuery.maybeSingle()

    if (connLookupErr) {
      console.error("[snaptrade-sync] Connection lookup error:", connLookupErr.message)
    }
    if (!storedConn && bodyConnectionId) {
      console.error(`[snaptrade-sync] No connection found for connectionId: ${bodyConnectionId} and user: ${snapUserId.slice(0, 8)}...`)
    }

    console.log(`[snaptrade-sync] Stored connection: ${storedConn?.id ?? "none"} | status: ${storedConn?.status ?? "n/a"} | institution: ${storedConn?.institution_name ?? "n/a"}`)

    const config = storedConn?.config as Record<string, unknown> | null ?? null
    const userSecret = config?.userSecret as string | undefined
    const storedSnapUserId = config?.snapTradeUserId as string | undefined

    if (!userSecret) return json({ error: "No userSecret found in DB — complete SnapTrade OAuth first" }, 400)

    // Warn if the userId used during registration differs from the current auth user ID.
    // A mismatch means the SnapTrade API will look up accounts for a different userId than was registered.
    if (storedSnapUserId && storedSnapUserId !== snapUserId) {
      console.warn(`[snaptrade-sync] userId mismatch! config.snapTradeUserId=${storedSnapUserId.slice(0, 8)}... vs current user.id=${snapUserId.slice(0, 8)}... — using stored snapTradeUserId for API call to match registration`)
    } else {
      console.log(`[snaptrade-sync] userId consistent | snapTradeUserId: ${(storedSnapUserId ?? snapUserId).slice(0, 8)}...`)
    }

    // Use the userId that was registered with SnapTrade (stored in config), not necessarily the current JWT sub.
    // If storedSnapUserId is missing, fall back to user.id — they should be identical unless something went wrong.
    const snapTradeUserId = storedSnapUserId ?? snapUserId

    // Preserve the existing institution name and external_id; only overwrite when the API provides better data
    const prevInstitutionName = storedConn?.institution_name as string | null ?? null
    const prevExternalId = storedConn?.external_id as string | null ?? null

    // Fetch all accounts for this SnapTrade user
    console.log(`[snaptrade-sync] Fetching accounts | endpoint: /api/v1/accounts | snapTradeUserId: ${snapTradeUserId.slice(0, 8)}...`)
    const acctResult = await snapTradeGet(clientId, consumerKey, "/api/v1/accounts", {
      userId: snapTradeUserId, userSecret,
    })

    if (!acctResult.ok) {
      const errBody = JSON.stringify(acctResult.data)
      console.error(`[snaptrade-sync] Account fetch failed | HTTP: ${acctResult.status} | body: ${errBody.substring(0, 500)}`)
      const connId = storedConn?.id
      if (connId) {
        await supabase.from("integration_connections").update({
          sync_status: "error",
          updated_at: new Date().toISOString(),
          connection_metadata: {
            last_sync_error: "account_fetch_failed",
            last_sync_error_at: new Date().toISOString(),
            http_status: acctResult.status,
          },
        }).eq("id", connId)
      }
      return json({ error: "Failed to fetch accounts from SnapTrade", httpStatus: acctResult.status }, 500)
    }

    // Diagnose response shape before filtering — critical for finding parsing failures
    const responseIsArray = Array.isArray(acctResult.data)
    if (!responseIsArray) {
      const dataType = acctResult.data === null ? "null" : typeof acctResult.data
      const dataShape = acctResult.data && typeof acctResult.data === "object"
        ? Object.keys(acctResult.data as Record<string, unknown>).join(", ")
        : String(acctResult.data).substring(0, 300)
      console.error(`[snaptrade-sync] UNEXPECTED: account response is NOT an array | type: ${dataType} | keys/value: ${dataShape}`)
      console.error(`[snaptrade-sync] This means SnapTrade returned a non-array response with HTTP 200 — treating as zero accounts`)
    }

    const rawAccounts = responseIsArray ? (acctResult.data as unknown[]) : []
    console.log(`[snaptrade-sync] SnapTrade returned ${rawAccounts.length} account(s) | response_was_array: ${responseIsArray}`)

    // Log first account shape so we can verify the parser matches the real API shape
    if (rawAccounts.length > 0) {
      const first = rawAccounts[0] as Record<string, unknown>
      const keys = Object.keys(first).join(", ")
      const bal = first?.balance as Record<string, unknown> | undefined
      const balTotal = bal?.total as Record<string, unknown> | undefined
      console.log(`[snaptrade-sync] First account keys: [${keys}]`)
      console.log(`[snaptrade-sync] First account field check: id=${first?.id !== undefined} | name=${first?.name !== undefined} | balance.total.amount=${balTotal?.amount !== undefined} | institution_name=${first?.institution_name !== undefined} | raw_type=${first?.raw_type !== undefined} | status=${first?.status !== undefined} | number=${first?.number !== undefined}`)
    }

    // Log each account at a safe, non-sensitive level
    for (const acct of rawAccounts) {
      const a = acct as Record<string, unknown>
      const bal = (a?.balance as Record<string, unknown>)?.total as Record<string, unknown> | undefined
      console.log(`[snaptrade-sync] Account | id: ${a?.id} | name: ${a?.name} | status: ${a?.status} | type: ${a?.raw_type} | balance: ${bal?.amount ?? "n/a"} ${bal?.currency ?? ""}`)
    }

    // Resolve institution name: top-level, then brokerage authorization nesting, then preserve existing
    const firstAcct = rawAccounts.length > 0 ? rawAccounts[0] as Record<string, unknown> : null
    const institutionNameFromApi = (
      firstAcct?.institution_name as string | undefined
      ?? ((firstAcct?.brokerage_authorization as Record<string, unknown>)?.brokerage as Record<string, unknown>)?.name as string | undefined
      ?? null
    )
    const institutionName = institutionNameFromApi ?? prevInstitutionName ?? "Brokerage"
    console.log(`[snaptrade-sync] Institution name: "${institutionName}" (source: ${institutionNameFromApi ? "api" : prevInstitutionName ? "preserved" : "default"})`)

    // Find or create the connection record
    let connectionId = storedConn?.id
    if (!connectionId) {
      const { data: newConn, error: insertConnErr } = await supabase
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
      if (insertConnErr || !newConn?.id) {
        console.error("[snaptrade-sync] Failed to create connection:", insertConnErr?.message)
        return json({ error: "Failed to create connection record", details: insertConnErr?.message }, 500)
      }
      connectionId = newConn.id
      console.log(`[snaptrade-sync] Created new connection: ${connectionId}`)
    } else {
      // Only overwrite institution_name when the API provides a real one
      const updateFields: Record<string, unknown> = {
        status: "active",
        connection_status: "active",
        sync_status: "syncing",
        // Preserve existing external_id unless a new authorizationId was provided
        external_id: authorizationId ?? prevExternalId,
        updated_at: new Date().toISOString(),
      }
      if (institutionNameFromApi) updateFields.institution_name = institutionNameFromApi

      await supabase.from("integration_connections").update(updateFields).eq("id", connectionId)
      console.log(`[snaptrade-sync] Updated existing connection: ${connectionId}`)
    }

    if (rawAccounts.length === 0) {
      console.warn("[snaptrade-sync] Zero accounts returned — persisting connected_no_accounts_returned state")
      await supabase.from("integration_connections").update({
        sync_status: "synced",
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        connection_metadata: {
          last_sync_result: "no_accounts_returned",
          last_sync_at: new Date().toISOString(),
        },
      }).eq("id", connectionId)
      return json({
        success: true,
        message: "SnapTrade returned zero accounts for this authorization. Connection exists but no accounts found.",
        accountsCount: 0,
        syncStatus: "connected_no_accounts_returned",
      })
    }

    // Clean up positions where asset_symbol was incorrectly stored as a JSON object string
    // (old sync code stored the entire SnapTrade symbol object instead of symbol.symbol string).
    // These rows are already soft-deleted in practice but this handles any edge cases.
    const { error: jsonCleanupErr } = await supabase
      .from("positions")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .like("asset_symbol", "{%")
      .is("deleted_at", null)
    if (jsonCleanupErr) {
      console.warn("[snaptrade-sync] JSON-format position cleanup failed:", jsonCleanupErr.message)
    } else {
      console.log("[snaptrade-sync] JSON-format position cleanup: complete")
    }

    // ── Per-account sync ──────────────────────────────────────────────────────
    let totalAccountsSynced = 0
    let totalPositionsSynced = 0
    let accountsWithPositions = 0
    let accountsMissingPositions = 0
    let positionSyncErrors = 0
    let accountSkipCount = 0
    let accountDbErrors = 0

    const syncedProviderAccountIds: string[] = []
    const perAccountBreakdown: AccountBreakdown[] = []

    for (const acct of rawAccounts) {
      const a = acct as Record<string, unknown>
      const acctId = a?.id as string
      if (!acctId) {
        console.warn("[snaptrade-sync] Skipping account with no id field — raw keys:", Object.keys(a).join(", "))
        continue
      }

      const balanceObj = (a?.balance as Record<string, unknown>)?.total as Record<string, unknown> | undefined
      const currentBalance = (balanceObj?.amount as number) ?? 0
      const currency = (balanceObj?.currency as string) ?? "USD"
      const acctName = a?.name as string ?? "Investment Account"
      const rawType = a?.raw_type as string ?? null
      const acctStatus = a?.status as string ?? "open"
      const mask = (a?.number as string)?.replace(/\*/g, "").slice(-4) ?? null
      const institutionAccountId = a?.institution_account_id as string ?? null

      // Closed accounts with $0 are treated as inactive — still record in syncedProviderAccountIds
      // so stale cleanup doesn't delete them from the DB (they might be reactivated later).
      syncedProviderAccountIds.push(acctId)

      if (acctStatus.toLowerCase() === "closed" && currentBalance === 0) {
        console.log(`[snaptrade-sync] Skipping closed $0 account | id: ${acctId} | name: ${acctName}`)
        perAccountBreakdown.push({
          snaptradeAccountId: acctId, name: acctName, type: rawType, mask, balance: currentBalance,
          skipped: true, skipReason: "closed_zero_balance", dbAction: "skipped", dbError: null,
          positionsCount: 0, positionsSyncStatus: "skipped",
        })
        accountSkipCount++
        continue
      }

      console.log(`[snaptrade-sync] Processing account | id: ${acctId} | name: ${acctName} | type: ${rawType} | balance: ${currentBalance} ${currency}`)

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
        metadata: { raw_type: rawType, institution_account_id: institutionAccountId },
        updated_at: new Date().toISOString(),
      }

      let dbAction: AccountBreakdown["dbAction"] = "inserted"
      let dbError: string | null = null

      if (existingAcct) {
        const { error: updateErr } = await supabase.from("financial_accounts").update({
          ...acctRecord,
          deleted_at: null, // reactivate if previously soft-deleted
        }).eq("id", existingAcct.id)
        if (updateErr) {
          console.error(`[snaptrade-sync] Account update failed | snapId: ${acctId} | db_id: ${existingAcct.id} | code: ${updateErr.code} | error: ${updateErr.message}`)
          dbAction = "error"
          dbError = updateErr.message
          accountDbErrors++
        } else {
          dbAction = "updated"
          totalAccountsSynced++
          console.log(`[snaptrade-sync] Account updated | snapId: ${acctId} | db_id: ${existingAcct.id}`)
        }
      } else {
        console.log(`[snaptrade-sync] Inserting new account | snapId: ${acctId} | name: ${acctName} | fields: user_id=${!!user.id} integration_connection_id=${!!connectionId} provider_account_id=${!!acctId} account_currency=${acctRecord.account_currency} account_type=investment`)
        const { error: insertErr } = await supabase.from("financial_accounts").insert({
          ...acctRecord,
          created_at: new Date().toISOString(),
        })
        if (insertErr) {
          console.error(`[snaptrade-sync] Account insert failed | snapId: ${acctId} | code: ${insertErr.code} | error: ${insertErr.message} | hint: ${insertErr.hint ?? "none"} | details: ${insertErr.details ?? "none"}`)
          dbAction = "error"
          dbError = insertErr.message
          accountDbErrors++
        } else {
          totalAccountsSynced++
          console.log(`[snaptrade-sync] Account inserted OK | snapId: ${acctId}`)
        }
      }

      // Resolve the local DB id for position linking
      const { data: resolvedAccount } = await supabase
        .from("financial_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", "snaptrade")
        .eq("provider_account_id", acctId)
        .single()

      if (!resolvedAccount) {
        console.error(`[snaptrade-sync] Could not resolve local account id after upsert | snapId: ${acctId}`)
        perAccountBreakdown.push({
          snaptradeAccountId: acctId, name: acctName, type: rawType, mask, balance: currentBalance,
          skipped: false, skipReason: null, dbAction, dbError,
          positionsCount: 0, positionsSyncStatus: "error",
        })
        continue
      }
      const financialAccountId = resolvedAccount.id

      // ── Positions for this account ────────────────────────────────────────
      const posResult = await snapTradeGetPositions(clientId, consumerKey, acctId, {
        userId: snapTradeUserId, userSecret,
      })

      if (!posResult.ok) {
        console.error(`[snaptrade-sync] Position fetch failed | snapId: ${acctId} | HTTP: ${posResult.status}`)
        positionSyncErrors++
        perAccountBreakdown.push({
          snaptradeAccountId: acctId, name: acctName, type: rawType, mask, balance: currentBalance,
          skipped: false, skipReason: null, dbAction, dbError,
          positionsCount: 0, positionsSyncStatus: "error",
        })
        continue
      }

      const positions = Array.isArray(posResult.data) ? posResult.data : []
      console.log(`[snaptrade-sync] Positions for account ${acctId}: ${positions.length}`)

      // Log first position shape to verify parser matches actual SnapTrade response
      if (positions.length > 0) {
        const firstPos = positions[0] as Record<string, unknown>
        const symObj = firstPos?.symbol as Record<string, unknown> | undefined
        console.log(`[snaptrade-sync] First position keys: [${Object.keys(firstPos).join(", ")}]`)
        console.log(`[snaptrade-sync] First position.symbol keys: [${symObj ? Object.keys(symObj).join(", ") : "n/a"}]`)
        console.log(`[snaptrade-sync] Field check: units=${firstPos?.units !== undefined} | price=${firstPos?.price !== undefined} | average_purchase_price=${firstPos?.average_purchase_price !== undefined} | open_pnl=${firstPos?.open_pnl !== undefined} | market_value=${firstPos?.market_value !== undefined}`)
      }

      if (positions.length === 0) {
        accountsMissingPositions++
      } else {
        accountsWithPositions++
      }

      const syncedSymbols: string[] = []
      let positionsForThisAccount = 0

      for (const pos of positions) {
        const p = pos as Record<string, unknown>
        const symbolObj = p?.symbol as Record<string, unknown>
        const symbol = symbolObj?.symbol as string ?? "UNKNOWN"
        const description = symbolObj?.description as string ?? symbol
        // Derive asset_type from SnapTrade symbol type code; normalize mutual_fund → etf
        const rawTypeCode = ((symbolObj?.type as Record<string, unknown>)?.code as string ?? "equity").toLowerCase()
        const assetType = rawTypeCode === "mutual_fund" ? "etf" : rawTypeCode
        const quantity = (p?.units as number) ?? 0
        const price = (p?.price as number) ?? 0
        // SnapTrade returns average_purchase_price (per-unit cost), not a total book_value field
        const avgPurchasePrice = (p?.average_purchase_price as number) ?? price
        const bookValue = avgPurchasePrice * quantity
        const marketValue = (p?.market_value as number) ?? (quantity * price)
        const unrealizedGain = marketValue - bookValue

        syncedSymbols.push(symbol)
        console.log(`[snaptrade-sync] Position | symbol: ${symbol} | qty: ${quantity} | price: ${price} | mktVal: ${marketValue}`)

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
          asset_type: assetType,
          currency: currency.substring(0, 3),
          calculated_quantity: quantity,
          average_cost_basis: avgPurchasePrice,
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
          const { error: posUpdateErr } = await supabase.from("positions").update({ ...posRecord, deleted_at: null }).eq("id", existingPos.id)
          if (posUpdateErr) {
            console.error(`[snaptrade-sync] Position update failed | symbol: ${symbol} | error:`, posUpdateErr.message)
          } else {
            totalPositionsSynced++
            positionsForThisAccount++
          }
        } else {
          const { error: posInsertErr } = await supabase.from("positions").insert({ ...posRecord, created_at: new Date().toISOString() })
          if (posInsertErr) {
            console.error(`[snaptrade-sync] Position insert failed | symbol: ${symbol} | error:`, posInsertErr.message)
          } else {
            totalPositionsSynced++
            positionsForThisAccount++
          }
        }
      }

      // Soft-delete positions no longer returned by SnapTrade for this account
      // (e.g. sold positions). Only run when we have a confirmed position list.
      if (syncedSymbols.length > 0) {
        const { error: stalePosDel } = await supabase
          .from("positions")
          .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("financial_account_id", financialAccountId)
          .is("deleted_at", null)
          .not("asset_symbol", "in", `(${syncedSymbols.join(",")})`)
        if (stalePosDel) {
          console.warn(`[snaptrade-sync] Stale position cleanup error | account: ${acctId}:`, stalePosDel.message)
        }
      }

      perAccountBreakdown.push({
        snaptradeAccountId: acctId, name: acctName, type: rawType, mask, balance: currentBalance,
        skipped: false, skipReason: null, dbAction, dbError,
        positionsCount: positionsForThisAccount,
        positionsSyncStatus: posResult.ok ? (positions.length > 0 ? "ok" : "empty") : "error",
      })
    }

    console.log(`[snaptrade-sync] Account summary | synced: ${totalAccountsSynced} | skipped: ${accountSkipCount} | db_errors: ${accountDbErrors}`)

    // Soft-delete stale brokerage accounts no longer returned by this sync
    // (e.g. accounts that moved to a different authorization or were closed).
    // ONLY runs when we have a confirmed non-empty account list from SnapTrade.
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
          console.log(`[snaptrade-sync] Soft-deleting stale account | provider_account_id: ${acct.provider_account_id}`)
          const now = new Date().toISOString()
          await supabase.from("financial_accounts").update({
            is_active: false, deleted_at: now, updated_at: now,
          }).eq("id", acct.id)
          await supabase.from("positions").update({
            deleted_at: now, updated_at: now,
          }).eq("financial_account_id", acct.id).is("deleted_at", null)
        }
      }
    }

    // Derive final sync_status from results
    let finalSyncStatus = "synced"
    const syncMetadata: Record<string, unknown> = {
      last_sync_at: new Date().toISOString(),
      accounts_returned: rawAccounts.length,
      accounts_synced: totalAccountsSynced,
      accounts_skipped: accountSkipCount,
      accounts_db_errors: accountDbErrors,
      positions_synced: totalPositionsSynced,
      accounts_with_positions: accountsWithPositions,
      accounts_missing_positions: accountsMissingPositions,
      position_sync_errors: positionSyncErrors,
    }

    if (positionSyncErrors > 0 && accountsWithPositions === 0) {
      finalSyncStatus = "error"
      syncMetadata.last_sync_error = "position_fetch_failed_all_accounts"
    } else if (accountDbErrors > 0 && totalAccountsSynced === 0) {
      finalSyncStatus = "error"
      syncMetadata.last_sync_error = "all_account_upserts_failed"
    } else if (positionSyncErrors > 0 || accountDbErrors > 0) {
      syncMetadata.last_sync_warning = "partial_failures"
    }

    console.log(`[snaptrade-sync] Final status: ${finalSyncStatus} | positions: ${totalPositionsSynced} | accounts_with_positions: ${accountsWithPositions}`)

    await supabase.from("integration_connections").update({
      sync_status: finalSyncStatus,
      last_synced: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      connection_metadata: syncMetadata,
    }).eq("id", connectionId)

    return json({
      success: true,
      institutionName,
      syncStatus: finalSyncStatus,
      accountsReturned: rawAccounts.length,
      accountsSynced: totalAccountsSynced,
      accountsSkipped: accountSkipCount,
      accountsDbErrors: accountDbErrors,
      positionsSynced: totalPositionsSynced,
      accountsWithPositions,
      accountsMissingPositions,
      positionSyncErrors,
      perAccountBreakdown,
    })

  } catch (err) {
    console.error("[snaptrade-sync] Unhandled error:", err)
    return json({ error: String(err) }, 500)
  }
})
