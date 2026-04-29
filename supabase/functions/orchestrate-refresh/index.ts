import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://finopsfinancialcenter.vercel.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json({ error: "Missing required environment variables" }, 500)
    }

    // Get user from JWT token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401)
    }

    // Verify the JWT and get the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return json({ error: "Unauthorized", details: userError?.message }, 401)
    }

    const userId = user.id
    console.log("orchestrate:user_id", userId)

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check for existing queued/processing job
    const { data: existingJob } = await supabase
      .from("refresh_jobs")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["queued", "processing"])
      .limit(1)
      .maybeSingle()

    if (existingJob) {
      console.log("orchestrate:existing_job", existingJob.id)
      // Still trigger worker in case it got stuck
      const workerUrl = `${supabaseUrl}/functions/v1/process-refresh-job`
      await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ job_id: existingJob.id })
      })
      return json({ status: "already_processing", job_id: existingJob.id }, 200)
    }

    // Create new job
    const { data: newJob, error: insertError } = await supabase
      .from("refresh_jobs")
      .insert({
        user_id: userId,
        trigger_mode: "manual",
        status: "queued",
        progress: 0,
        queued_at: new Date().toISOString(),
      })
      .select("id, user_id, status")
      .single()

    if (insertError || !newJob) {
      return json({ error: "Job insert failed", details: insertError?.message ?? "No job returned" }, 500)
    }

    console.log("orchestrate:new_job_id", newJob.id)

    // Trigger worker
    const workerUrl = `${supabaseUrl}/functions/v1/process-refresh-job`
    console.log("orchestrate:worker_url", workerUrl)

    let workerResp: Response
    try {
      workerResp = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ job_id: newJob.id })
      })
    } catch (err) {
      console.error("orchestrate:worker_fetch_failed", err)
      return json({ error: "Worker invocation failed", job_id: newJob.id, details: err instanceof Error ? err.message : String(err) }, 500)
    }

    const workerText = await workerResp.text()
    console.log("orchestrate:worker_response_status", workerResp.status)
    console.log("orchestrate:worker_response_body", workerText)

    if (!workerResp.ok) {
      return json({ status: "queued_but_worker_failed", job_id: newJob.id, worker_status: workerResp.status, worker_body: workerText }, 500)
    }

    return json({ status: "queued", job_id: newJob.id, worker_status: workerResp.status }, 200)

  } catch (err) {
    console.error("orchestrate:unexpected_error", err)
    return json({ error: "Unexpected error", details: err instanceof Error ? err.message : String(err) }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  })
}
