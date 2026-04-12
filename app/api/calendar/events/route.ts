import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");

    const url = day
      ? `${BACKEND_URL}/calendar/events?day=${encodeURIComponent(day)}`
      : `${BACKEND_URL}/calendar/events`;

    const backendRes = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // 5 second timeout — calendar can be slow on cold start
      signal: AbortSignal.timeout(5000),
    });

    if (!backendRes.ok) {
      const err = await backendRes.text();
      console.error("[calendar/events] backend error:", err);
      return NextResponse.json(
        { events: [], error: "Calendar backend error" },
        { status: 200 } // return 200 with empty so UI degrades gracefully
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    // Graceful degradation — calendar is optional; don't crash the dashboard
    console.error("[calendar/events] error:", error);
    return NextResponse.json(
      {
        events: [],
        error: "Google Calendar is not configured or backend is offline.",
      },
      { status: 200 }
    );
  }
}
