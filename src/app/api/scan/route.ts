import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";

// POST /api/scan — trigger a manual scan (simulates the GitHub Actions cron job)
export async function POST() {
  try {
    const result = await runScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
