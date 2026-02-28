import type { Metadata } from "next";
import "./globals.css";
import { NavLink } from "@/components/nav-link";

export const metadata: Metadata = {
  title: "vMarket",
  description: "Market analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <header className="border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-11 gap-0">
            <div className="flex items-center gap-2 mr-4 sm:mr-8">
              <div className="w-2 h-2 bg-data-positive rounded-full animate-pulse" />
              <span className="text-sm font-semibold tracking-[0.15em] text-foreground/70">
                vMarket
              </span>
            </div>
            <div className="flex items-center h-full overflow-x-auto">
              <NavLink href="/">Overview</NavLink>
              <NavLink href="/tech">Tech</NavLink>
              <NavLink href="/news">News</NavLink>
              <NavLink href="/pinescript">PineScript</NavLink>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
