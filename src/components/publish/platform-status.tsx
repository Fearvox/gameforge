'use client';

import { useState } from 'react';
import { Plus, ChevronDown, Link2, Unlink, RotateCw, type LucideIcon } from 'lucide-react';
import { usePublishStore, type PlatformState } from '@/lib/publish-store';

const DOT_STYLES: Record<PlatformState, string> = {
  connected: 'bg-gaming-success shadow-[0_0_6px_rgba(34,197,94,0.5)]',
  expiring: 'bg-gaming-warning shadow-[0_0_6px_rgba(234,179,8,0.5)]',
  disconnected: 'bg-muted-foreground/40',
};

const LABEL_STYLES: Record<PlatformState, string> = {
  connected: 'text-gaming-success',
  expiring: 'text-gaming-warning',
  disconnected: 'text-muted-foreground',
};

const LABELS: Record<PlatformState, string> = {
  connected: '已连接',
  expiring: '即将过期',
  disconnected: '未连接',
};

interface ActionItem {
  label: string;
  icon: LucideIcon;
  variant: 'default' | 'danger';
  onClick: () => void;
}

function PlatformActions({
  state,
  onConnect,
  onDisconnect,
  onReconnect,
}: {
  state: PlatformState;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}) {
  const actions: ActionItem[] =
    state === 'connected'
      ? [{ label: '断开连接', icon: Unlink, variant: 'danger', onClick: onDisconnect }]
      : state === 'expiring'
        ? [{ label: '重新授权', icon: RotateCw, variant: 'default', onClick: onReconnect }]
        : [{ label: '连接', icon: Link2, variant: 'default', onClick: onConnect }];

  return (
    <div className="flex gap-1">
      {actions.map(({ label, icon: Icon, variant, onClick }) => (
        <button
          key={label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            variant === 'danger'
              ? 'text-gaming-error hover:bg-gaming-error/10'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function PlatformStatus() {
  const { platforms, connectPlatform, disconnectPlatform, reconnectPlatform } =
    usePublishStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((p) => (
        <div key={p.id} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
            className="glass-card flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
          >
            <span className="text-base">{p.icon}</span>
            <span className="text-sm font-medium text-foreground">{p.name}</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${DOT_STYLES[p.state]}`}
            />
            <span className={`text-xs ${LABEL_STYLES[p.state]}`}>
              {LABELS[p.state]}
            </span>
            {p.hint && (
              <span className="text-[10px] text-gaming-warning/70">{p.hint}</span>
            )}
            {p.state !== 'disconnected' && (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </button>

          {/* Dropdown menu */}
          {openMenu === p.id && (
            <div className="absolute left-0 top-full z-10 mt-1 glass-card rounded-lg p-2 shadow-lg">
              <PlatformActions
                state={p.state}
                onConnect={() => {
                  connectPlatform(p.id);
                  setOpenMenu(null);
                }}
                onDisconnect={() => {
                  disconnectPlatform(p.id);
                  setOpenMenu(null);
                }}
                onReconnect={() => {
                  reconnectPlatform(p.id);
                  setOpenMenu(null);
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add platform — dashed border */}
      <button className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-gaming-purple hover:text-gaming-purple">
        <Plus className="h-3.5 w-3.5" />
        添加平台
      </button>
    </div>
  );
}
