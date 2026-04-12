import { NextResponse } from "next/server";
import { loginUser, signToken, getTokenCookieOptions, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["user", "provider"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'user' or 'provider'" }, { status: 400 });
    }

    const userData = await loginUser({ email, password, role });
    const token = await signToken(userData);

    const res = NextResponse.json({
      success: true,
      user: { email: userData.email, name: userData.name, role: userData.role },
    });

    res.cookies.set(COOKIE_NAME, token, getTokenCookieOptions());
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    const status = message === "Invalid email or password" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
