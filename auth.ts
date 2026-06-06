// Custom auth — replaces NextAuth. Session is managed in authStore (Zustand + localStorage)
// This file exists for backwards compatibility with any imports
export { useAuthStore, getAuthHeaders } from "@/lib/stores/authStore";
