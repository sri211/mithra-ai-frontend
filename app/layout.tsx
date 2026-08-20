import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Mithra AI — Your Elite Career Companion",
  description: "AI-powered job search platform. Build resumes, adapt them to JDs, find jobs, auto-apply, and network — all powered by Mithra, your personal AI career agent.",
  keywords: ["AI resume builder", "job search", "career AI", "resume optimizer", "job application"],
  openGraph: {
    title: "Mithra AI — Your Elite Career Companion",
    description: "Build world-class resumes, find jobs, auto-apply, and network with AI.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable} h-full`}>
      <body className="h-full antialiased" suppressHydrationWarning>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
