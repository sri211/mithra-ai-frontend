import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
