import type { Metadata } from "next";
import "./globals.css";
import GlobalLevelUp from "./components/GlobalLevelUp";

export const metadata: Metadata = {
  title: "FinOps Financial Center",
  description: "Your intelligent AI-powered financial command center for trading, investing, crypto, taxes, and budgeting.",
  keywords: ["finance", "trading", "crypto", "tax", "budgeting", "AI"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<GlobalLevelUp /></body>
    </html>
  );
}
