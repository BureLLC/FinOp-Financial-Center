import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model ?? "claude-sonnet-4-5",
        max_tokens: body.max_tokens ?? 1000,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(data));
      console.error("Status:", response.status);
      return NextResponse.json({ 
        error: data?.error?.message ?? "API error",
        status: response.status,
        details: data 
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
