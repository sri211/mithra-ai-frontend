import axios from "axios";

export const API_BASE =
  process.env.NODE_ENV === "production"
    ? "/api/backend"
    : "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 120000, // 2 min — Claude adaption can take 60-90s
});

// Attach Bearer token on every request
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

export async function streamSSE(
  url: string,
  body: object,
  onChunk: (text: string) => void,
  onDone?: () => void
) {
  const response = await fetch(
    `${API_BASE}${url}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") { onDone?.(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onChunk(parsed.text);
          else onChunk(data);
        } catch {
          onChunk(data);
        }
      }
    }
  }
  onDone?.();
}
