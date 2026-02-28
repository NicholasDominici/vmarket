import type { Metadata } from "next";
import "./globals.css";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientProviders } from "@/components/client-providers";
import { ConnectButton } from "@/components/connect-button";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t?t==='dark':true)}catch(e){document.documentElement.classList.add('dark')}})();`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ClientProviders>
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
                <NavLink href="/iran">Iran</NavLink>
                <NavLink href="/trade">Trade</NavLink>
                <NavLink href="/pinescript">PineScript</NavLink>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ConnectButton />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
