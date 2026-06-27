import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";
// Vercel Hobby: max 10s default. We request 60s for LLM generation (Hobby allows up to 60s with this config).
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────
// /api/scan/trigger — Idempotent scan endpoint for EXTERNAL crons
//
// Supports TWO trigger methods:
//   1. POST  /api/scan/trigger            → for cron-job.org, GitHub Actions, QStash (headers custom OK)
//   2. GET   /api/scan/trigger?run=1      → for UptimeRobot free plan (GET-only, no custom headers)
//      GET   /api/scan/trigger             → health check only (no scan, returns 200 OK)
//
// Security:
//   - If CRON_API_KEY env var is set:
//     · POST requires X-API-Key header
//     · GET  requires ?key=CRON_API_KEY query param (for UptimeRobot)
//   - If CRON_API_KEY is NOT set: open access (dev mode)
//
// Idempotency:
//   - ScanLock distributed lock (5 min TTL) → concurrent triggers safe
//   - 2 min debounce → rapid triggers skipped
// ─────────────────────────────────────────────────────────────

async function handleScan(req: NextRequest, source: string) {
  const workerId = `trigger-${source}-${Date.now().toString(36)}`;

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

function checkAuth(req: NextRequest): NextResponse | null {
  const expectedKey = process.env.CRON_API_KEY;
  if (!expectedKey) return null; // Open access (dev mode)

  // Check X-API-Key header (POST from cron-job.org/GitHub Actions/QStash)
  const headerKey = req.headers.get("x-api-key");
  if (headerKey === expectedKey) return null;

  // Check ?key= query param (GET from UptimeRobot — can't send custom headers)
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key");
  if (queryKey === expectedKey) return null;

  return NextResponse.json(
    { ok: false, error: "Unauthorized: invalid or missing API key", timestamp: new Date().toISOString() },
    { status: 401 }
  );
}

// POST /api/scan/trigger — for cron-job.org, GitHub Actions, QStash
// curl -X POST https://app.vercel.app/api/scan/trigger -H "X-API-Key: $CRON_API_KEY"
export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const source = req.headers.get("x-cron-source") || "post";
  return handleScan(req, source);
}

// GET /api/scan/trigger?run=1 — for UptimeRobot free plan (GET-only, no custom headers)
// GET /api/scan/trigger          — health check (no scan)
//
// UptimeRobot config:
//   URL: https://app.vercel.app/api/scan/trigger?run=1&key=YOUR_CRON_API_KEY
//   Method: GET (UptimeRobot does GET by default on free plan)
//   Interval: 5 minutes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shouldRun = searchParams.get("run") === "1";

  // Health check mode (no scan) — still requires auth if CRON_API_KEY is set
  const authError = checkAuth(req);
  if (authError) return authError;

  if (!shouldRun) {
    return NextResponse.json({
      ok: true,
      endpoint: "/api/scan/trigger",
      methods: {
        POST: "Trigger scan (with X-API-Key header)",
        "GET ?run=1": "Trigger scan via GET (for UptimeRobot — use ?key=CRON_API_KEY for auth)",
        GET: "This health check (no scan)",
      },
      auth: process.env.CRON_API_KEY
        ? "required (X-API-Key header OR ?key= query param)"
        : "open (no CRON_API_KEY set)",
      docs: "Idempotent scan. Concurrent calls locked. Rapid calls debounced (2 min).",
      timestamp: new Date().toISOString(),
    });
  }

  // Trigger mode (?run=1) — actually run the scan
  const source = searchParams.get("source") || "uptimerobot";
  return handleScan(req, source);
}
