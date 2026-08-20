"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Product + web analytics. Fully env-gated: with no NEXT_PUBLIC_POSTHOG_KEY set,
// this renders children untouched and loads nothing — so the app is unaffected
// until the key is added to the Vercel environment.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || typeof window === "undefined") return;
    if (!posthog.__loaded) {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false,      // we capture manually for App Router SPA navigations
        capture_pageleave: true,
        person_profiles: "identified_only",
        defaults: "2025-05-24",
      });
    }
  }, []);

  if (!KEY) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

// App Router: route changes are client-side, so Next fires no full page load.
// Capture $pageview on every pathname/search change instead.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
