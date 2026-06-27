import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";
// Vercel Hobby: max 10s default. We request 60s for LLM generation (Hobby allows up to 60s with this config).
export const maxDuration = 60;

// POST /api/scan/trigger
// Idempotent endpoint for EXTERNAL crons (UptimeRobot, cron-job.org, GitHub Actions, QStash).
// - Distributed lock via ScanLock table → concurrent triggers are safe (only 1 runs, others skip)
// - Debounce: skips if last scan < 2 min ago
// - Auto-publishes top 3 opportunities per scan (LLM FR + EN → PUBLISHED)
// - Optional API key via X-API-Key header (set CRON_API_KEY env var to enforce)
//
// Example external cron call:
//   curl -X POST https://your-app.vercel.app/api/scan/trigger \
//     -H "X-API-Key: $CRON_API_KEY" \
//     --max-time 60
export async function POST(req: NextRequest) {
  // API key check (if CRON_API_KEY is set in env, require matching header)
  const expectedKey = process.env.CRON_API_KEY;
  if (expectedKey) {
    const providedKey = req.headers.get("x-api-key");
    if (providedKey !== expectedKey) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: invalid or missing X-API-Key" },
        { status: 401 }
      );
    }
  }

  // Worker ID for traceability
  const workerId = `trigger-${req.headers.get("x-cron-source") || "unknown"}-${Date.now().toString(36)}`;

  try {
    const result = await runScan({
      autoPublish: true,
      maxPublish: 3,
      workerId,
    });

    if (result.skipped) {
      // 200 with skipped=true so external monitors don't alert on "failure"
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: result.reason,
        message: result.reason === "locked"
          ? "Another scan is running — skipped"
          : "Last scan too recent — debounced",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json(
      { ok: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// GET — health check for external monitors (returns 200 OK without scanning)
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/scan/trigger",
    method: "POST",
    auth: process.env.CRON_API_KEY ? "required (X-API-Key header)" : "open (no CRON_API_KEY set)",
    docs: "Send POST to trigger an idempotent scan. Concurrent calls are locked. Rapid calls are debounced.",
  });
}
