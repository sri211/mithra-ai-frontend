import { NextResponse } from "next/server";

// Stub route — NextAuth replaced with custom authStore
// Returning empty providers so any library check doesn't crash
export async function GET() {
  return NextResponse.json({ credentials: { id: "credentials", name: "Email", type: "credentials", signinUrl: "/login", callbackUrl: "/api/auth/callback/credentials" }, google: { id: "google", name: "Google", type: "oauth", signinUrl: "/login", callbackUrl: "/api/auth/callback/google" } });
}

export async function POST() {
  return NextResponse.json({ ok: false });
}
