import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const startTime = Date.now()
  let jobId: string | null = null

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json()
    jobId = body?.job_id ?? null

    if (!jobId) return json({ error: "Missing job_id" }, 400)

    const { data: job, error: jobError } = await supabase
      .from("refresh_jobs")
      .select("id, user_id, status, current_stage")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return json({ error: "Job not found", details: jobError?.message ?? null }, 404)
    }

    if (job.status !== "queued") {
      return json({ error: "Job not in queued state", current_status: job.status }, 400)
    }

    const { data: lockedJob, error: lockError } = await supabase
      .from("refresh_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        progress: 5,
        current_stage: "sync_integrations",
        error_message: null,
      })
      .eq("id", jobId)
      .eq("status", "queued")
      .select("id")
      .single()

    if (lockError || !lockedJob) {
      throw new Error(`Failed to lock job: ${lockError?.message ?? "No row updated"}`)
    }

    // ── STAGE 1: sync_integrations (REAL) ──────────────────────────────────
    await syncIntegrations(supabase, job.user_id)
    await updateStage(supabase, jobId, "rebuild_positions", 20)

    // ── STAGE 2: rebuild_positions (REAL) ──────────────────────────────────
    await rebuildPositions(supabase, job.user_id)
    await updateStage(supabase, jobId, "portfolio_snapshot", 35)

    // ── STAGE 3: portfolio_snapshot (REAL) ─────────────────────────────────
    await buildPortfolioSnapshot(supabase, job.user_id)
    await updateStage(supabase, jobId, "risk_snapshot", 50)

    // ── STAGE 4: risk_snapshot (simulated — implemented later) ─────────────
    await simulateStage(300)
    await updateStage(supabase, jobId, "tax_calculation", 65)

    // ── STAGE 5: tax_calculation (REAL) ────────────────────────────────────
    await calculateTaxes(supabase, job.user_id)
    await updateStage(supabase, jobId, "trend_generation", 80)

    // ── STAGE 6–8: simulated (implemented later) ────────────────────────────
    await simulateStage(300)
    await updateStage(supabase, jobId, "alerts_evaluation", 90)
    await simulateStage(300)
    await updateStage(supabase, jobId, "ai_refresh", 95)
    await simulateStage(300)

    const executionTime = Date.now() - startTime

    const { error: completeError } = await supabase
      .from("refresh_jobs")
      .update({
        status: "completed",
        progress: 100,
        current_stage: "completed",
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
      })
      .eq("id", jobId)

    if (completeError) throw new Error(`Failed to complete job: ${completeError.message}`)

    return json({ status: "completed", job_id: jobId }, 200)

  } catch (err) {
    const details = err instanceof Error ? err.message : String(err)
    if (jobId) {
      await supabase
        .from("refresh_jobs")
        .update({
          status: "failed",
          error_message: details,
          completed_at: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
        })
        .eq("id", jobId)
    }
    return json({ error: "Processing failed", details }, 500)
  }
})

// ── calculateTaxes ────────────────────────────────────────────────────────────
async function calculateTaxes(supabase: any, userId: string) {
  const { data: profiles, error } = await supabase
    .from("tax_profiles")
    .select("id, tax_year, filing_status, entity_type, jurisdiction_id, is_primary")
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("jurisdiction_id", "is", null)

  if (error) throw new Error(`Failed to fetch tax profiles: ${error.message}`)

  // Option B: if no profiles exist, skip silently
  if (!profiles || profiles.length === 0) return

  for (const profile of profiles) {
    await calculateTaxForProfile(supabase, userId, profile)
  }
}

// ── calculateTaxForProfile ────────────────────────────────────────────────────
async function calculateTaxForProfile(supabase: any, userId: string, profile: any) {
  const taxYear: number = profile.tax_year
  const startOfYear = `${taxYear}-01-01T00:00:00+00:00`
  const endOfYear   = `${taxYear}-12-31T23:59:59+00:00`

  // ── Get jurisdiction ──────────────────────────────────────────────────────
  const { data: jurisdiction, error: jError } = await supabase
    .from("jurisdictions")
    .select("id, code, jurisdiction_type, name")
    .eq("id", profile.jurisdiction_id)
    .single()

  if (jError || !jurisdiction) return

  // ── Fetch self-employment and rental income for this tax year ─────────────
  // Only transactions explicitly tagged as business or rental income are taxable.
  // W2 salary (income_subtype = 'salary') is excluded — taxes already withheld.
  const { data: incomeTxs, error: txError } = await supabase
    .from("transactions")
    .select("amount, income_subtype")
    .eq("user_id", userId)
    .eq("transaction_type", "income")
    .in("income_subtype", ["business", "rental"])
    .eq("direction", "credit")
    .eq("status", "posted")
    .gte("transaction_date", startOfYear)
    .lte("transaction_date", endOfYear)

  if (txError) throw new Error(`Failed to fetch income transactions: ${txError.message}`)

  const grossSEIncome = (incomeTxs ?? []).reduce(
    (sum: number, tx: any) => sum + Number(tx.amount), 0
  )

  // ── Self-employment tax ───────────────────────────────────────────────────
  // Applies to business income only (not rental income in most cases).
  // For simplicity this engine applies SE tax to all business+rental income.
  // The user's CPA should confirm rental income SE tax applicability.
  const seTax = calculateSETax(grossSEIncome, taxYear)

  // Half of SE tax is deductible from taxable income (IRS Form 1040 Schedule SE)
  const seDeduction = round2(seTax * 0.5)

  // ── Adjusted taxable income for income tax ────────────────────────────────
  const taxableIncome = Math.max(0, grossSEIncome - seDeduction)

  // ── Fetch income tax brackets for this jurisdiction ───────────────────────
  const filingStatus = profile.filing_status ?? "single"

  let bracketsQuery = supabase
    .from("tax_rates")
    .select("bracket_min, bracket_max, rate")
    .eq("jurisdiction_id", profile.jurisdiction_id)
    .eq("tax_year", taxYear)
    .eq("tax_type", "income")
    .eq("is_active", true)
    .order("bracket_min", { ascending: true })

  // Federal brackets are per filing status. State brackets use NULL (all filers).
  if (jurisdiction.code === "US-FED") {
    bracketsQuery = bracketsQuery.eq("filing_status", filingStatus)
  } else {
    bracketsQuery = bracketsQuery.is("filing_status", null)
  }

  const { data: brackets, error: bError } = await bracketsQuery
  if (bError) throw new Error(`Failed to fetch tax brackets: ${bError.message}`)

  // ── Calculate income tax using progressive brackets ───────────────────────
  const incomeTax = calculateProgressiveTax(taxableIncome, brackets ?? [])

  // ── Total liability and quarterly breakdown ───────────────────────────────
  const totalTaxLiability = round2(incomeTax + seTax)
  const quarterlyAmount   = round2(totalTaxLiability / 4)
  const now = new Date().toISOString()

  // ── Upsert annual estimate ────────────────────────────────────────────────
  await upsertTaxEstimate(supabase, {
    userId,
    taxProfileId:  profile.id,
    jurisdictionId: profile.jurisdiction_id,
    taxYear,
    periodType:    "annual",
    quarter:       null,
    periodStart:   `${taxYear}-01-01`,
    periodEnd:     `${taxYear}-12-31`,
    taxableIncome: round2(grossSEIncome),
    incomeTax:     round2(incomeTax),
    seTax:         round2(seTax),
    totalTaxLiability,
    now,
  })

  // ── Upsert four quarterly estimates ──────────────────────────────────────
  const quarters = [
    { q: 1, start: `${taxYear}-01-01`, end: `${taxYear}-03-31` },
    { q: 2, start: `${taxYear}-04-01`, end: `${taxYear}-05-31` },
    { q: 3, start: `${taxYear}-06-01`, end: `${taxYear}-08-31` },
    { q: 4, start: `${taxYear}-09-01`, end: `${taxYear}-12-31` },
  ]

  for (const { q, start, end } of quarters) {
    await upsertTaxEstimate(supabase, {
      userId,
      taxProfileId:   profile.id,
      jurisdictionId: profile.jurisdiction_id,
      taxYear,
      periodType:     "quarterly",
      quarter:        q,
      periodStart:    start,
      periodEnd:      end,
      taxableIncome:  round2(grossSEIncome / 4),
      incomeTax:      round2(incomeTax / 4),
      seTax:          round2(seTax / 4),
      totalTaxLiability: quarterlyAmount,
      now,
    })
  }
}

// ── calculateSETax ────────────────────────────────────────────────────────────
// Self-employment tax = employee + employer Social Security + Medicare
// SS rate: 12.4% on net SE income up to the SS wage base
// Medicare rate: 2.9% on all net SE income (no cap)
// Net SE income = gross SE income × 0.9235 (IRS-defined multiplier)
// SS wage base: $176,100 (2025) | $180,000 approximate (2026)
function calculateSETax(grossIncome: number, taxYear: number): number {
  if (grossIncome <= 0) return 0
  const ssWageBase = taxYear >= 2026 ? 180000 : 176100
  const netSEIncome = grossIncome * 0.9235
  let tax = 0
  if (netSEIncome <= ssWageBase) {
    tax = netSEIncome * 0.153
  } else {
    tax = (ssWageBase * 0.153) + ((netSEIncome - ssWageBase) * 0.029)
  }
  return round2(tax)
}

// ── calculateProgressiveTax ───────────────────────────────────────────────────
// Applies marginal bracket rates to income progressively.
// Brackets must be sorted ascending by bracket_min.
// bracket_max = null means the bracket has no upper limit (top bracket).
function calculateProgressiveTax(income: number, brackets: any[]): number {
  if (income <= 0 || brackets.length === 0) return 0
  let tax = 0
  for (const bracket of brackets) {
    const bracketMin = Number(bracket.bracket_min)
    const bracketMax = bracket.bracket_max !== null ? Number(bracket.bracket_max) : Infinity
    const rate       = Number(bracket.rate)
    if (income <= bracketMin) break
    const incomeInBracket = Math.min(income, bracketMax) - bracketMin
    if (incomeInBracket > 0) {
      tax += incomeInBracket * rate
    }
  }
  return round2(tax)
}

// ── upsertTaxEstimate ─────────────────────────────────────────────────────────
async function upsertTaxEstimate(supabase: any, params: {
  userId: string
  taxProfileId: string
  jurisdictionId: string
  taxYear: number
  periodType: string
  quarter: number | null
  periodStart: string
  periodEnd: string
  taxableIncome: number
  incomeTax: number
  seTax: number
  totalTaxLiability: number
  now: string
}) {
  const {
    userId, taxProfileId, jurisdictionId, taxYear, periodType, quarter,
    periodStart, periodEnd, taxableIncome, incomeTax, seTax,
    totalTaxLiability, now,
  } = params

  const balanceDue       = totalTaxLiability
  const underpaymentFlag = balanceDue > 0

  // ── Check for existing estimate ───────────────────────────────────────────
  let existingQuery = supabase
    .from("tax_estimates")
    .select("id")
    .eq("user_id", userId)
    .eq("tax_profile_id", taxProfileId)
    .eq("jurisdiction_id", jurisdictionId)
    .eq("tax_year", taxYear)
    .eq("period_type", periodType)

  if (quarter !== null) {
    existingQuery = existingQuery.eq("quarter", quarter)
  } else {
    existingQuery = existingQuery.is("quarter", null)
  }

  const { data: existing, error: selectError } = await existingQuery.maybeSingle()
  if (selectError) throw new Error(`Failed to check existing estimate: ${selectError.message}`)

  const estimateData = {
    user_id:                userId,
    tax_profile_id:         taxProfileId,
    jurisdiction_id:        jurisdictionId,
    tax_year:               taxYear,
    period_type:            periodType,
    quarter:                quarter,
    period_start_date:      periodStart,
    period_end_date:        periodEnd,
    taxable_income:         taxableIncome,
    income_tax:             incomeTax,
    self_employment_tax:    seTax,
    total_tax_liability:    totalTaxLiability,
    total_payments_applied: 0,
    balance_due:            balanceDue,
    underpayment_flag:      underpaymentFlag,
    calculated_at:          now,
    source:                 "refresh_job",
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("tax_estimates")
      .update(estimateData)
      .eq("id", existing.id)
    if (updateError) throw new Error(`Failed to update tax estimate: ${updateError.message}`)
  } else {
    const { error: insertError } = await supabase
      .from("tax_estimates")
      .insert({ ...estimateData, created_at: now })
    if (insertError) throw new Error(`Failed to insert tax estimate: ${insertError.message}`)
  }
}

// ── buildPortfolioSnapshot ────────────────────────────────────────────────────
async function buildPortfolioSnapshot(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0]
  const now   = new Date().toISOString()

  const { data: accounts, error: accountsError } = await supabase
    .from("financial_accounts")
    .select("id, account_type, current_balance, available_balance, account_currency")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("is_archived", false)
    .is("deleted_at", null)

  if (accountsError) throw new Error(`Failed to fetch accounts for snapshot: ${accountsError.message}`)

  const { data: positions, error: positionsError } = await supabase
    .from("positions")
    .select("asset_type, last_valuation, unrealized_gain")
    .eq("user_id", userId)
    .is("deleted_at", null)

  if (positionsError) throw new Error(`Failed to fetch positions for snapshot: ${positionsError.message}`)

  let totalCash = 0
  let totalInvestments = 0
  let totalLiabilities = 0
  let unrealizedGain = 0

  for (const position of positions ?? []) {
    const valuation = Number(position.last_valuation ?? 0)
    if (position.asset_type === "cash") {
      totalCash += valuation
    } else if (["equity","etf","crypto","fixed_income","option","future","forex"].includes(position.asset_type)) {
      totalInvestments += valuation
    }
    unrealizedGain += Number(position.unrealized_gain ?? 0)
  }

  for (const account of accounts ?? []) {
    if (account.account_type === "credit") {
      totalLiabilities += Number(account.current_balance ?? 0)
    }
  }

  const totalAssets  = totalCash + totalInvestments
  const totalNetWorth = totalAssets - totalLiabilities

  const { data: existingSnapshot } = await supabase
    .from("portfolio_snapshots")
    .select("id")
    .eq("user_id", userId)
    .eq("snapshot_date", today)
    .maybeSingle()

  const snapshotData = {
    user_id:          userId,
    snapshot_date:    today,
    total_net_worth:  totalNetWorth,
    total_assets:     totalAssets,
    total_liabilities: totalLiabilities,
    total_cash:       totalCash,
    total_investments: totalInvestments,
    unrealized_gain:  unrealizedGain,
    base_currency:    "USD",
    calculated_at:    now,
    source:           "refresh_job",
  }

  if (existingSnapshot) {
    const { error } = await supabase
      .from("portfolio_snapshots")
      .update(snapshotData)
      .eq("id", existingSnapshot.id)
    if (error) throw new Error(`Failed to update portfolio_snapshot: ${error.message}`)
  } else {
    const { error } = await supabase
      .from("portfolio_snapshots")
      .insert({ ...snapshotData, created_at: now })
    if (error) throw new Error(`Failed to insert portfolio_snapshot: ${error.message}`)
  }

  for (const account of accounts ?? []) {
    const currency = (account.account_currency ?? "USD").trim().substring(0, 3)

    const { data: existingHistory } = await supabase
      .from("account_balance_history")
      .select("id")
      .eq("user_id", userId)
      .eq("financial_account_id", account.id)
      .eq("snapshot_date", today)
      .maybeSingle()

    const historyData = {
      user_id:              userId,
      financial_account_id: account.id,
      snapshot_date:        today,
      available_balance:    account.available_balance ?? null,
      current_balance:      account.current_balance ?? null,
      currency,
      balance_source_type:  "plaid",
      recorded_at:          now,
    }

    if (existingHistory) {
      const { error } = await supabase
        .from("account_balance_history")
        .update(historyData)
        .eq("id", existingHistory.id)
      if (error) throw new Error(`Failed to update account_balance_history: ${error.message}`)
    } else {
      const { error } = await supabase
        .from("account_balance_history")
        .insert({ ...historyData, created_at: now })
      if (error) throw new Error(`Failed to insert account_balance_history: ${error.message}`)
    }
  }
}

// ── rebuildPositions ──────────────────────────────────────────────────────────
async function rebuildPositions(supabase: any, userId: string) {
  const { data: accounts, error } = await supabase
    .from("financial_accounts")
    .select("id, account_type, account_subtype, current_balance, account_currency")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("is_archived", false)
    .is("deleted_at", null)

  if (error) throw new Error(`Failed to fetch accounts for positions: ${error.message}`)
  if (!accounts || accounts.length === 0) return

  for (const account of accounts) {
    if (account.account_type?.toLowerCase() === "depository") {
      if (account.current_balance === null || account.current_balance === undefined) continue
      await upsertCashPosition(supabase, userId, account)
    }
  }
}

// ── upsertCashPosition ────────────────────────────────────────────────────────
async function upsertCashPosition(supabase: any, userId: string, account: any) {
  const currency = (account.account_currency ?? "USD").trim().substring(0, 3)
  const balance  = account.current_balance
  const now      = new Date().toISOString()

  const { data: existing, error: selectError } = await supabase
    .from("positions")
    .select("id")
    .eq("user_id", userId)
    .eq("financial_account_id", account.id)
    .eq("asset_symbol", "USD")
    .eq("asset_type", "cash")
    .is("deleted_at", null)
    .maybeSingle()

  if (selectError) throw new Error(`Failed to check existing position: ${selectError.message}`)

  const positionData = {
    user_id:              userId,
    financial_account_id: account.id,
    asset_symbol:         "USD",
    asset_name:           "US Dollar",
    asset_type:           "cash",
    currency,
    calculated_quantity:  balance,
    average_cost_basis:   1.00,
    total_cost_basis:     balance,
    last_price:           1.00,
    last_valuation:       balance,
    unrealized_gain:      0,
    is_short:             false,
    last_calculated_at:   now,
    last_synced_at:       now,
    updated_at:           now,
  }

  if (existing) {
    const { error } = await supabase.from("positions").update(positionData).eq("id", existing.id)
    if (error) throw new Error(`Failed to update cash position: ${error.message}`)
  } else {
    const { error } = await supabase.from("positions").insert({ ...positionData, created_at: now })
    if (error) throw new Error(`Failed to insert cash position: ${error.message}`)
  }
}

// ── syncIntegrations ──────────────────────────────────────────────────────────
async function syncIntegrations(supabase: any, userId: string) {
  const { data: connections, error: connError } = await supabase
    .from("integration_connections")
    .select("id, external_id, access_token_encrypted, institution_name")
    .eq("user_id", userId)
    .eq("provider", "plaid")
    .eq("status", "active")

  if (connError) throw new Error(`Failed to fetch connections: ${connError.message}`)
  if (!connections || connections.length === 0) return

  for (const connection of connections) {
    const syncLogId = await startSyncLog(supabase, userId, connection.id, "plaid", "manual")

    try {
      const accountsResponse = await fetch("https://production.plaid.com/accounts/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:    Deno.env.get("PLAID_CLIENT_ID"),
          secret:       Deno.env.get("PLAID_SECRET"),
          access_token: connection.access_token_encrypted,
        }),
      })

      const accountsData = await accountsResponse.json()
      if (!accountsResponse.ok || !accountsData.accounts) {
        throw new Error(`Plaid accounts fetch failed: ${JSON.stringify(accountsData)}`)
      }

      const accountIdMap: Record<string, string> = {}
      for (const acct of accountsData.accounts) {
        const dbId = await upsertFinancialAccount(supabase, userId, connection.id, connection.institution_name, acct)
        accountIdMap[acct.account_id] = dbId
      }

      const endDate      = new Date().toISOString().split("T")[0]
      const startDateObj = new Date()
      startDateObj.setDate(startDateObj.getDate() - 90)
      const startDate = startDateObj.toISOString().split("T")[0]

      const txResponse = await fetch("https://production.plaid.com/transactions/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:    Deno.env.get("PLAID_CLIENT_ID"),
          secret:       Deno.env.get("PLAID_SECRET"),
          access_token: connection.access_token_encrypted,
          start_date:   startDate,
          end_date:     endDate,
          options:      { count: 500, offset: 0 },
        }),
      })

      const txData = await txResponse.json()
      if (!txResponse.ok || !txData.transactions) {
        throw new Error(`Plaid transactions fetch failed: ${JSON.stringify(txData)}`)
      }

      let transactionsSynced = 0
      for (const tx of txData.transactions) {
        const financialAccountId = accountIdMap[tx.account_id]
        if (!financialAccountId) continue
        await upsertTransaction(supabase, userId, financialAccountId, tx)
        transactionsSynced++
      }

      await completeSyncLog(supabase, syncLogId, "success", accountsData.accounts.length, transactionsSynced, null)
      await supabase
        .from("integration_connections")
        .update({ sync_status: "synced", last_synced: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", connection.id)

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await completeSyncLog(supabase, syncLogId, "failed", 0, 0, errMsg)
      await supabase
        .from("integration_connections")
        .update({ sync_status: "error", updated_at: new Date().toISOString() })
        .eq("id", connection.id)
      throw err
    }
  }
}

// ── upsertFinancialAccount ────────────────────────────────────────────────────
async function upsertFinancialAccount(
  supabase: any, userId: string, connectionId: string,
  institutionName: string | null, acct: any
): Promise<string> {
  const { data: existing } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("integration_connection_id", connectionId)
    .eq("provider_account_id", acct.account_id)
    .maybeSingle()

  const accountData = {
    user_id:                  userId,
    integration_connection_id: connectionId,
    provider:                 "plaid",
    provider_account_id:      acct.account_id,
    account_name:             acct.name,
    account_type:             acct.type,
    account_subtype:          acct.subtype ?? null,
    account_currency:         (acct.balances?.iso_currency_code ?? "USD").substring(0, 3),
    is_crypto:                false,
    available_balance:        acct.balances?.available ?? null,
    current_balance:          acct.balances?.current ?? null,
    credit_limit:             acct.balances?.limit ?? null,
    balance_source_type:      "plaid",
    last_balance_sync_at:     new Date().toISOString(),
    tax_treatment:            "taxable",
    is_business_account:      false,
    is_active:                true,
    is_archived:              false,
    institution_name:         institutionName ?? null,
    mask:                     acct.mask ?? null,
    metadata:                 {},
    updated_at:               new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase.from("financial_accounts").update(accountData).eq("id", existing.id)
    if (error) throw new Error(`Failed to update financial_account: ${error.message}`)
    return existing.id
  }

  const { data: inserted, error } = await supabase
    .from("financial_accounts")
    .insert({ ...accountData, created_at: new Date().toISOString() })
    .select("id")
    .single()

  if (error || !inserted) throw new Error(`Failed to insert financial_account: ${error?.message ?? "No row returned"}`)
  return inserted.id
}

// ── upsertTransaction ─────────────────────────────────────────────────────────
async function upsertTransaction(supabase: any, userId: string, financialAccountId: string, tx: any) {
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("external_transaction_id", tx.transaction_id)
    .eq("provider", "plaid")
    .maybeSingle()

  if (!existing) {
    const { data: duplicateByFingerprint } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("financial_account_id", financialAccountId)
      .eq("provider", "plaid")
      .eq("amount", Math.abs(tx.amount))
      .eq("transaction_date", new Date(tx.date).toISOString())
      .eq("description", tx.name ?? null)
      .limit(1)
      .maybeSingle()

    if (duplicateByFingerprint) {
      return
    }
  }

  if (existing) {
    await supabase
      .from("transactions")
      .update({ status: tx.pending ? "pending" : "posted", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    return
  }

  const direction = tx.amount >= 0 ? "debit" : "credit"
  const absAmount = Math.abs(tx.amount)

  const { error } = await supabase.from("transactions").insert({
    user_id:                 userId,
    financial_account_id:    financialAccountId,
    provider:                "plaid",
    external_transaction_id: tx.transaction_id,
    transaction_type:        "bank",
    direction,
    status:                  tx.pending ? "pending" : "posted",
    amount:                  absAmount,
    currency:                (tx.iso_currency_code ?? "USD").substring(0, 3),
    transaction_date:        new Date(tx.date).toISOString(),
    description:             tx.name ?? null,
    merchant_name:           tx.merchant_name ?? null,
    category:                tx.category?.[0] ?? null,
    subcategory:             tx.category?.[1] ?? null,
    taxable_event:           false,
    synced_at:               new Date().toISOString(),
    created_at:              new Date().toISOString(),
    updated_at:              new Date().toISOString(),
  })

  if (error) throw new Error(`Failed to insert transaction: ${error.message}`)
}

// ── startSyncLog ──────────────────────────────────────────────────────────────
async function startSyncLog(
  supabase: any, userId: string, connectionId: string, provider: string, triggerMode: string
): Promise<string> {
  const { data, error } = await supabase
    .from("sync_logs")
    .insert({
      user_id:                  userId,
      integration_connection_id: connectionId,
      provider,
      trigger_mode:             triggerMode,
      status:                   "running",
      started_at:               new Date().toISOString(),
      created_at:               new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error || !data) throw new Error(`Failed to create sync_log: ${error?.message}`)
  return data.id
}

// ── completeSyncLog ───────────────────────────────────────────────────────────
async function completeSyncLog(
  supabase: any, syncLogId: string, status: string,
  accountsSynced: number, transactionsSynced: number, errorMessage: string | null
) {
  await supabase
    .from("sync_logs")
    .update({ status, completed_at: new Date().toISOString(), accounts_synced: accountsSynced, transactions_synced: transactionsSynced, error_message: errorMessage })
    .eq("id", syncLogId)
}

// ── updateStage ───────────────────────────────────────────────────────────────
async function updateStage(supabase: any, jobId: string, stage: string, progress: number) {
  const { error } = await supabase
    .from("refresh_jobs")
    .update({ current_stage: stage, progress })
    .eq("id", jobId)
  if (error) throw new Error(`Failed updating stage ${stage}: ${error.message}`)
}

// ── simulateStage ─────────────────────────────────────────────────────────────
async function simulateStage(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── round2 ────────────────────────────────────────────────────────────────────
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ── json ──────────────────────────────────────────────────────────────────────
function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
