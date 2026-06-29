import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/scan
// Triggered by the UI "Lancer un scan" button. Same pipeline as /api/scan/trigger
// but with auto-publish enabled and no API key required (internal use).
// Query param ?force=1 bypasses the debounce (for manual testing).
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";

    const result = await runScan({
      autoPublish: true,
      maxPublish: 3,
      workerId: `ui-${Date.now().toString(36)}`,
      force, // bypass debounce when ?force=1
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
