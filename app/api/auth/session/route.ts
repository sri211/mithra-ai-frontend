import { NextResponse } from "next/server";

// Simple session endpoint — actual session is managed in client-side authStore
// This exists so any code checking /api/auth/session gets a valid response
export async function GET() {
  return NextResponse.json({ user: null });
}
