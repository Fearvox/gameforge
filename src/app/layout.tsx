import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/dash-tokens.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameForge — Game UP Master Studio",
  description: "All-in-one platform for gaming content creators: smart editing, cover design, and multi-platform publishing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* DASH brand stamp — subtle footer watermark */}
        <footer className="fixed bottom-2 right-3 z-50 opacity-30 hover:opacity-60 transition-opacity pointer-events-none">
          <img src="/brand/dash-full-dark-bg.svg" alt="DASH" className="h-3.5 w-auto" />
        </footer>
      </body>
    </html>
  );
}
