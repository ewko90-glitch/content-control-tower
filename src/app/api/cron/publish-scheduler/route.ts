import { processPendingPublications } from "@/lib/publication-scheduler";
import { NextResponse } from "next/server";

// API route for publication scheduler
// Call this from a cron job (e.g., every 5 minutes)

export async function POST(request: Request) {
  // Verify cron secret if configured
  const expectedToken = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (expectedToken && (!authHeader || authHeader !== `Bearer ${expectedToken}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPendingPublications();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Publication scheduler error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * Manual trigger for testing/debugging
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const result = await processPendingPublications();
  return NextResponse.json(result);
}
