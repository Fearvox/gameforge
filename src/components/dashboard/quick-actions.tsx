import { Upload, Scissors, Image } from 'lucide-react';

const ACTIONS = [
  { label: 'Upload Assets', icon: Upload, colorClass: 'text-gaming-purple' },
  { label: 'New Edit', icon: Scissors, colorClass: 'text-gaming-blue' },
  { label: 'Design Cover', icon: Image, colorClass: 'text-gaming-cyan' },
];

export default function QuickActions() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {ACTIONS.map(({ label, icon: Icon, colorClass }) => (
        <button
          key={label}
          className="flex shrink-0 items-center gap-2 rounded-xl glass-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Icon className={`h-4 w-4 ${colorClass}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
