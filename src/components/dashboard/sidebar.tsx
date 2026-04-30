'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Scissors,
  Image,
  Send,
  BarChart3,
  Lightbulb,
  Sparkles,
  X,
} from 'lucide-react';
import { useWorkbenchStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assets', label: 'Assets', icon: FolderOpen },
  { href: '/dashboard/cut', label: 'Smart Cut', icon: Scissors },
  { href: '/dashboard/cover', label: 'Cover Studio', icon: Image },
  { href: '/dashboard/publish', label: 'Publish', icon: Send },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/strategy', label: 'Strategy', icon: Lightbulb },
  { href: '/dashboard/ai', label: 'AI Lab', icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useWorkbenchStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 flex-col border-r border-border bg-sidebar transition-transform md:static md:flex ${
          sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full md:flex md:translate-x-0'
        }`}
      >
        {/* Logo + Close (mobile) */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-gaming flex items-center justify-center text-white font-bold text-sm">
              GF
            </div>
            <span className="text-lg font-semibold tracking-tight">GameForge</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => sidebarOpen && toggleSidebar()}
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
    </>
  );
}
