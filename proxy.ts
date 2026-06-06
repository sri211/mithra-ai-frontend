import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/resume-builder", "/resume-adaptor", "/job-finder",
  "/job-application", "/network", "/interview-prep", "/tracker", "/pricing",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("mithra-token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/resume-builder/:path*", "/resume-adaptor/:path*", "/job-finder/:path*",
    "/job-application/:path*", "/network/:path*", "/interview-prep/:path*",
    "/tracker/:path*", "/pricing/:path*",
  ],
};
