import { NextResponse } from "next/server";
import { registerUser, signToken, getTokenCookieOptions, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, businessName, category, location } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["user", "provider"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'user' or 'provider'" }, { status: 400 });
    }

    const userData = await registerUser({ name, email, password, role, businessName, category, location });
    const token = await signToken(userData);

    const res = NextResponse.json({
      success: true,
      user: { email: userData.email, name: userData.name, role: userData.role },
    });

    res.cookies.set(COOKIE_NAME, token, getTokenCookieOptions());
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status = message === "Email already registered" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
