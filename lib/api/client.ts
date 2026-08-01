import axios from "axios";

export const API_BASE =
  process.env.NODE_ENV === "production"
    ? "/api/backend"
    : "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// Attach Bearer token on every request from persisted store
api.interceptors.request.use((config) => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("mithra-auth") : null;
    if (raw) {
      const token = JSON.parse(raw)?.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// ── 401 Auto-Refresh ──────────────────────────────────────────────────────────
// When any API call returns 401 (expired token):
//   1. Pause all other in-flight requests
//   2. Silently refresh using the stored refresh token
//   3. Retry all queued requests with the new token
//   4. If refresh fails → logout

let _isRefreshing = false;
let _waitQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(newToken: string | null, err: unknown) {
  _waitQueue.forEach(({ resolve, reject }) => {
    if (newToken) resolve(newToken);
    else reject(err);
  });
  _waitQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const req = error.config;

    // 402 = insufficient credits — surface the global top-up modal
    if (error.response?.status === 402 && typeof window !== "undefined") {
      const detail = error.response?.data?.detail || {};
      window.dispatchEvent(new CustomEvent("mithra:out-of-credits", { detail }));
      return Promise.reject(error);
    }

    // Only handle 401, and don't retry auth endpoints or already-retried calls
    if (
      error.response?.status !== 401 ||
      req?._retry ||
      req?.url?.includes("/auth/refresh") ||
      req?.url?.includes("/auth/login") ||
      req?.url?.includes("/auth/register") ||
      req?.url?.includes("/auth/google")
    ) {
      return Promise.reject(error);
    }

    req._retry = true;

    if (_isRefreshing) {
      // Another refresh is already in progress — queue this request
      return new Promise<string>((resolve, reject) => {
        _waitQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          req.headers["Authorization"] = `Bearer ${newToken}`;
          return api(req);
        })
        .catch(() => Promise.reject(error));
    }

    _isRefreshing = true;

    try {
      // Dynamic import prevents circular dep (authStore → api → authStore)
      const { useAuthStore } = await import("@/lib/stores/authStore");
      const newToken = await useAuthStore.getState().refreshAccessToken();

      if (newToken) {
        drainQueue(newToken, null);
        req.headers["Authorization"] = `Bearer ${newToken}`;
        return api(req);
      } else {
        drainQueue(null, error);
        return Promise.reject(error);
      }
    } catch (refreshError) {
      drainQueue(null, refreshError);
      return Promise.reject(error);
    } finally {
      _isRefreshing = false;
    }
  }
);

export async function streamSSE(
  url: string,
  body: object,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onMeta?: (meta: Record<string, unknown>) => void
) {
  const raw = typeof window !== "undefined" ? localStorage.getItem("mithra-auth") : null;
  const token = raw ? JSON.parse(raw)?.state?.accessToken : null;

  const response = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // Buffer across reads: a network chunk can split an SSE line in half, so we
  // only process lines terminated by "\n" and keep the trailing partial for the
  // next read. Without this, the final meta/action line can be silently dropped.
  let buffer = "";

  const handleLine = (line: string): boolean => {
    if (!line.startsWith("data: ")) return false;
    const data = line.slice(6).trim();
    if (data === "[DONE]") { onDone?.(); return true; }
    try {
      const parsed = JSON.parse(data);
      if (parsed.meta) onMeta?.(parsed.meta);
      else if (parsed.text) onChunk(parsed.text);
      else onChunk(data);
    } catch {
      onChunk(data);
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep the last (possibly incomplete) line
    for (const line of lines) {
      if (handleLine(line)) return; // [DONE] seen
    }
  }
  // flush any trailing complete line left in the buffer
  if (buffer.trim() && handleLine(buffer.trim())) return;
  onDone?.();
}
