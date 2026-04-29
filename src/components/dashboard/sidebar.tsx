'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Scissors,
  Image,
  Send,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assets', label: 'Assets', icon: FolderOpen },
  { href: '/dashboard/cut', label: 'Smart Cut', icon: Scissors },
  { href: '/dashboard/cover', label: 'Cover Studio', icon: Image },
  { href: '/dashboard/publish', label: 'Publish', icon: Send },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-8 w-8 rounded-lg gradient-gaming flex items-center justify-center text-white font-bold text-sm">
          GF
        </div>
        <span className="text-lg font-semibold tracking-tight">GameForge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gaming-purple/20 flex items-center justify-center text-gaming-purple text-xs font-semibold">
            UP
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Player One</p>
            <p className="truncate text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
