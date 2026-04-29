'use client';

import { Menu } from 'lucide-react';
import Sidebar from '@/components/dashboard/sidebar';
import { useWorkbenchStore } from '@/lib/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const toggleSidebar = useWorkbenchStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <div className="h-6 w-6 rounded-md gradient-gaming flex items-center justify-center text-white text-[10px] font-bold">
              GF
            </div>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gaming-purple/20 flex items-center justify-center text-gaming-purple text-xs font-semibold">
              UP
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-sidebar/95 backdrop-blur-sm px-2 py-2 md:hidden">
        {[
          { label: 'Home', icon: '🏠' },
          { label: 'Assets', icon: '📁' },
          { label: 'Cut', icon: '✂️' },
          { label: 'Cover', icon: '🎨' },
          { label: 'Publish', icon: '📤' },
        ].map(({ label, icon }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground"
          >
            <span className="text-base">{icon}</span>
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
