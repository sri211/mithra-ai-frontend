/**
 * Fire-and-forget event tracker for Mithra AI admin analytics.
 * Never throws — analytics must never break the app.
 *
 * Usage:
 *   track("page_view", { page: "/resume-builder", user_id: user?.id })
 *   track("feature_use", { feature: "resume_adapter", user_id: user?.id })
 *   track("auth_event", { feature: "google_signup", user_id: user?.id })
 *   track("upgrade_click", { feature: "pro", user_id: user?.id })
 */

const API_BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api/backend"
    : "http://localhost:8000/api";

export type TrackEvent =
  | "page_view"
  | "feature_use"
  | "auth_event"
  | "upgrade_click"
  | "resume_upload"
  | "resume_download";

interface TrackOpts {
  page?: string;
  feature?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

export function track(event: TrackEvent, opts?: TrackOpts): void {
  if (typeof window === "undefined") return;
  try {
    fetch(`${API_BASE}/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...opts }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow — analytics must never throw
  }
}

/** Convenience: track current page. Call in useEffect on each page. */
export function trackPage(path: string, userId?: string): void {
  track("page_view", { page: path, user_id: userId });
}

/** Convenience: track feature engagement. */
export function trackFeature(feature: string, userId?: string): void {
  track("feature_use", { feature, user_id: userId });
}
