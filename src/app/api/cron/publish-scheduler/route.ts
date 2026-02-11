import { processPendingPublications } from "@/lib/publication-scheduler";

// API route for publication scheduler
// Call this from a cron job (e.g., every 5 minutes)
// 
// Example cron configuration (Vercel Crons):
// POST /api/cron/publish-scheduler
// Schedule: every 5 minutes

export async function POST(request: Request) {
  // Verify cron secret if configured
  const expectedToken = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (expectedToken && (!authHeader || authHeader !== `Bearer ${expectedToken}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await processPendingPublications();
    
    return Response.json(result);
  } catch (error) {
    console.error("Publication scheduler error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing/debugging
 */
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not allowed in production", { status: 403 });
  }

  const result = await processPendingPublications();
  return Response.json(result);
}
