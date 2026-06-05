import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/resume-builder",
  "/resume-adaptor",
  "/job-finder",
  "/job-application",
  "/network",
  "/interview-prep",
  "/tracker",
  "/pricing",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isProtected = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/resume-builder/:path*",
    "/resume-adaptor/:path*",
    "/job-finder/:path*",
    "/job-application/:path*",
    "/network/:path*",
    "/interview-prep/:path*",
    "/tracker/:path*",
    "/pricing/:path*",
  ],
};
