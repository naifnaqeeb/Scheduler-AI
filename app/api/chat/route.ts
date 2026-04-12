import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, conversation_id } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        user_id: session.userId,
        user_role: session.role,
        conversation_id: conversation_id || `${session.userId}-${Date.now()}`,
      }),
    });

    if (!backendRes.ok) {
      const err = await backendRes.text();
      console.error("[chat API] backend error:", err);
      return NextResponse.json(
        { error: "AI agent error. Please try again." },
        { status: 502 }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[chat API] error:", error);
    return NextResponse.json(
      { error: "Failed to reach AI backend. Make sure backend is running." },
      { status: 503 }
    );
  }
}
