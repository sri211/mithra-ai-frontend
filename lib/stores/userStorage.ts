// Storage adapter that namespaces all keys by userId
// So user A's resume is in "mithra-resume-userA-id", user B's in "mithra-resume-userB-id"

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem("mithra-auth");
    return JSON.parse(raw ?? "")?.state?.user?.id ?? "guest";
  } catch {
    return "guest";
  }
}

export const userStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    const key = `${name}-${getCurrentUserId()}`;
    return localStorage.getItem(key);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    const key = `${name}-${getCurrentUserId()}`;
    localStorage.setItem(key, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    const key = `${name}-${getCurrentUserId()}`;
    localStorage.removeItem(key);
  },
};
