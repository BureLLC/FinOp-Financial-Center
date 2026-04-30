# FinOps Financial Center — Architecture & Security Audit (2026-04-29)

## Scope
Code-level review of:
- Plaid and SnapTrade integration flows
- Sync orchestration and data fan-out paths
- Financial calculation engine in refresh worker
- AI data-path controls

## 1) Risk Assessment (prioritized)

### Critical
1. **Secrets and sensitive responses are logged in serverless functions.**
   - Plaid client ID/secret prefixes and raw Plaid responses are logged.
   - SnapTrade userSecret is logged.
   - This is a direct credential exposure path via logs.
2. **Provider access tokens are stored without application-layer encryption.**
   - `access_token_encrypted` is written with plaintext token values.
   - Compromise of DB or privileged read path exposes full broker/bank access.
3. **Financial math uses floating-point (`number`) in tax and positions logic.**
   - Risk of rounding drift and reporting discrepancies across modules.

### High
4. **No webhook verification implementation for Plaid/SnapTrade is present.**
   - Inbound event integrity and replay resistance are not enforced in code paths reviewed.
5. **Weak sync idempotency safeguards for account/position ingest.**
   - Upsert patterns are partial and rely on app logic; race conditions can duplicate or overwrite unexpectedly.
6. **No explicit rate limiting / abuse throttling at function entrypoints.**

### Medium
7. **Refresh worker executes with service-role auth but lacks caller attestation.**
   - Endpoint can be invoked directly if service key leaks.
8. **Quarter date boundaries in tax estimates appear non-standard for IRS estimated payment windows.**
9. **Client retry path for Plaid link token creation had broken re-init behavior (fixed in this patch).**

## 2) Security Vulnerability List
- **CWE-532**: Insertion of sensitive information into logs.
- **CWE-312**: Cleartext storage of sensitive information.
- **CWE-362**: Race condition in financial state updates without strict uniqueness + transaction boundaries.
- **CWE-345**: Insufficient verification of data authenticity (missing webhook signature validation).
- **CWE-770**: Missing throttling controls on expensive sync endpoints.

## 3) Financial Accuracy Review
- Position and tax pipelines use JS number arithmetic; this is not acceptable for money-critical computations.
- Tax engine hard-codes Social Security wage base approximation for 2026.
- Quarterly period windows are not aligned to canonical IRS estimated-tax due date model.
- Sync pipeline mixes simulated stages with production stages, creating timing ambiguities for UI “real-time” claims.

## 4) AI (LevelUP) Architecture Risk
- No dedicated server-side policy boundary observed between raw transaction tables and AI prompt context.
- Required controls:
  1. Build a **read-only curated financial summary view** per user for AI access.
  2. Strip provider tokens, account masks beyond last-4, and free-text memos before prompt construction.
  3. Add prompt-injection guardrail and output schema validation.
  4. Persist immutable AI audit log (`who`, `what inputs`, `model`, `output hash`, `timestamp`).

## 5) Performance Optimization Plan
1. Move provider sync to durable queue workers (one job per connection + per account fan-out).
2. Add DB indexes:
   - `integration_connections(user_id, provider, external_id)` unique
   - `financial_accounts(user_id, integration_connection_id, provider_account_id)` unique
   - `positions(user_id, provider_account_id, asset_symbol)` unique
   - `transactions(user_id, transaction_date, status)` composite
3. Materialize portfolio snapshots and tax aggregates for dashboard reads.
4. Use websocket/Realtime updates from refresh_jobs and snapshot tables to avoid stale UI polling.

## 6) App Architecture Scalability Review
- Current architecture is page-local fetch-heavy; introduce shared query cache and invalidation strategy.
- Introduce a central “sync status” store across summary, tax, investments, trading modules.
- Enforce module reads from canonical snapshot tables, not ad-hoc recomputations in each page.

## 7) Refactored High-Level Architecture (textual)
1. **Integration Edge**: Plaid/SnapTrade adapters + strict webhook verifier + idempotency keys.
2. **Ingestion Bus**: Durable queue (connection sync, account sync, tx sync, position sync).
3. **Ledger Core**: Immutable transaction/event tables + reconciliation jobs.
4. **Computation Layer**: Decimal-safe tax/P&L engines; deterministic batch recomputation.
5. **Read Models**: Materialized views for summary/investments/tax/budget/income/trading.
6. **AI Boundary**: Sanitized summary API only; no direct raw table/token access.
7. **Audit & Security**: Centralized audit log, secrets manager, KMS envelope encryption.

## 8) Compliance Best Practices
- SOC 2 CC6/CC7 aligned logging and least privilege key rotation.
- Encrypt sensitive columns using envelope encryption (KMS-managed DEKs).
- Annual penetration testing + webhook replay testing.
- Automated controls: SAST, dependency scanning, migration policy checks.
- Deterministic, versioned tax logic with effective-date tables (no hard-coded annual constants).

## Immediate Remediation Backlog (first 14 days)
1. Remove sensitive logs and rotate any exposed Plaid/SnapTrade credentials.
2. Encrypt stored provider tokens with KMS envelope keys and re-encrypt existing rows.
3. Introduce decimal math library for money/tax/position calculations.
4. Add strict unique constraints + transactional upserts for accounts/positions/transactions.
5. Add webhook signature verification + replay nonce store.
