import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { API_BASE } from "@/lib/api/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            plan: data.user.plan,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          };
        } catch {
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, exchange the id_token for our own JWT
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          // Attach our tokens to the user object (picked up in jwt callback)
          (user as Record<string, unknown>).accessToken = data.access_token;
          (user as Record<string, unknown>).refreshToken = data.refresh_token;
          (user as Record<string, unknown>).plan = data.user.plan;
          (user as Record<string, unknown>).id = data.user.id;
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as Record<string, unknown>).id as string ?? token.sub ?? "";
        token.plan = (user as Record<string, unknown>).plan as string ?? "free";
        token.accessToken = (user as Record<string, unknown>).accessToken as string ?? "";
        token.refreshToken = (user as Record<string, unknown>).refreshToken as string ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session as any;
      s.user.id = token.id as string;
      s.accessToken = token.accessToken as string;
      s.refreshToken = token.refreshToken as string;
      s.user.plan = token.plan as string;
      return s;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "mithra_nextauth_secret_2026",
});
