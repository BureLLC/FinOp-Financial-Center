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
    const { authorizationId } = body
    const snapUserId = user.id

    console.log(`[snaptrade-sync] Starting sync | user: ${snapUserId.slice(0, 8)}... | authorizationId: ${authorizationId ?? "(none — re-sync)"}`)

    // Fetch stored connection — no status filter so reconnect / re-sync can reactivate
    const { data: storedConn, error: connLookupErr } = await supabase
      .from("integration_connections")
      .select("id, config, status, institution_name, external_id")
      .eq("user_id", user.id)
      .eq("provider", "snaptrade")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (connLookupErr) {
      console.error("[snaptrade-sync] Connection lookup error:", connLookupErr.message)
    }

    console.log(`[snaptrade-sync] Stored connection: ${storedConn?.id ?? "none"} | status: ${storedConn?.status ?? "n/a"} | institution: ${storedConn?.institution_name ?? "n/a"}`)

    const userSecret = (storedConn?.config as Record<string, unknown>)?.userSecret as string
    if (!userSecret) return json({ error: "No userSecret found in DB — complete SnapTrade OAuth first" }, 400)

    // Preserve the existing institution name and external_id; only overwrite when the API provides better data
    const prevInstitutionName = storedConn?.institution_name as string | null ?? null
    const prevExternalId = storedConn?.external_id as string | null ?? null

    // Fetch all accounts for this SnapTrade user
    const acctResult = await snapTradeGet(clientId, consumerKey, "/api/v1/accounts", {
      userId: snapUserId, userSecret,
    })

    if (!acctResult.ok) {
      console.error("[snaptrade-sync] Account fetch failed | HTTP:", acctResult.status, "| body:", JSON.stringify(acctResult.data))
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

    const rawAccounts = Array.isArray(acctResult.data) ? acctResult.data : []
    console.log(`[snaptrade-sync] SnapTrade returned ${rawAccounts.length} account(s)`)

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
          console.error(`[snaptrade-sync] Account update failed | id: ${acctId} | error:`, updateErr.message)
          dbAction = "error"
          dbError = updateErr.message
          accountDbErrors++
        } else {
          dbAction = "updated"
          totalAccountsSynced++
          console.log(`[snaptrade-sync] Account updated | id: ${acctId} | db_id: ${existingAcct.id}`)
        }
      } else {
        const { error: insertErr } = await supabase.from("financial_accounts").insert({
          ...acctRecord,
          created_at: new Date().toISOString(),
        })
        if (insertErr) {
          console.error(`[snaptrade-sync] Account insert failed | id: ${acctId} | error:`, insertErr.message)
          dbAction = "error"
          dbError = insertErr.message
          accountDbErrors++
        } else {
          totalAccountsSynced++
          console.log(`[snaptrade-sync] Account inserted | id: ${acctId}`)
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
        userId: snapUserId, userSecret,
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
        const quantity = p?.units as number ?? 0
        const price = p?.price as number ?? 0
        const marketValue = (p?.market_value as number) ?? (quantity * price)
        const bookValue = (p?.book_value as number) ?? 0
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
