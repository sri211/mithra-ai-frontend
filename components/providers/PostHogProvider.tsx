"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
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
        capture_pageview: false,      // captured manually below for App Router SPA navigations
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

// App Router: route changes are client-side, so Next fires no full page load —
// capture $pageview on every pathname/search change instead. Because the provider
// init runs in a parent effect (which fires AFTER this child effect on first
// mount), PostHog may not be loaded yet on the very first pageview; poll briefly
// so the initial landing pageview is never dropped.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;

    const fire = () => posthog.capture("$pageview", { $current_url: url });

    if (posthog.__loaded) { fire(); return; }
    // wait for init (parent effect) to complete, then fire once
    let tries = 0;
    const iv = setInterval(() => {
      if (posthog.__loaded) { fire(); clearInterval(iv); }
      else if (++tries > 40) clearInterval(iv); // give up after ~4s
    }, 100);
    return () => clearInterval(iv);
  }, [pathname, searchParams]);

  return null;
}
