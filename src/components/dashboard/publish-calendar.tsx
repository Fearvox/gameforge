'use client';

interface CalendarDay {
  day: string;
  date: number;
  events: { title: string; platform: string; color: string }[];
  isToday?: boolean;
}

const DAYS: CalendarDay[] = [
  { day: 'Mon', date: 28, events: [{ title: 'Genshin 4.5', platform: 'Bilibili', color: 'gaming-blue' }] },
  { day: 'Tue', date: 29, events: [], isToday: true },
  { day: 'Wed', date: 30, events: [{ title: 'ZZZ Review', platform: 'YouTube', color: 'gaming-error' }] },
  { day: 'Thu', date: 1, events: [] },
  { day: 'Fri', date: 2, events: [{ title: 'HSR 2.3', platform: 'Douyin', color: 'gaming-cyan' }] },
  { day: 'Sat', date: 3, events: [] },
  { day: 'Sun', date: 4, events: [] },
];

export default function PublishCalendar() {
  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Publish Calendar
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {/* Header row */}
        {DAYS.map((d) => (
          <div
            key={d.day}
            className="text-center text-[10px] font-medium text-muted-foreground pb-1"
          >
            {d.day}
          </div>
        ))}
        {/* Date cells */}
        {DAYS.map((d) => (
          <div
            key={d.date}
            className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 min-h-[56px] ${
              d.isToday
                ? 'border border-gaming-purple/40 bg-gaming-purple/10'
                : 'bg-background/30'
            }`}
          >
            <span
              className={`text-xs font-mono ${
                d.isToday ? 'text-gaming-purple font-semibold' : 'text-muted-foreground'
              }`}
            >
              {d.date}
            </span>
            {d.events.map((ev) => (
              <div
                key={ev.title}
                className={`w-full rounded bg-${ev.color}/15 px-1 py-0.5 text-[9px] font-medium text-${ev.color} text-center truncate`}
                title={`${ev.title} → ${ev.platform}`}
              >
                {ev.platform.slice(0, 3)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
