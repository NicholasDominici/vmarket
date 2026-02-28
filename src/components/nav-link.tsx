'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`h-full flex items-center px-3 sm:px-4 text-sm font-medium tracking-[0.08em] uppercase transition-all border-b glow-hover ${
        active
          ? 'border-foreground/50 text-foreground'
          : 'border-transparent text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  );
}
