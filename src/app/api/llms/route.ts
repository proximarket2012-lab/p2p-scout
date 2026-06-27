import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/llms — list all LLMs in rotation (10 models)
export async function GET() {
  const llms = await db.llmModel.findMany({
    orderBy: { priority: "asc" },
  });
  return NextResponse.json({ llms });
}
