'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MOCK_DATA = [
  { date: 'Mon', views: 12400, likes: 890, comments: 120 },
  { date: 'Tue', views: 18200, likes: 1320, comments: 185 },
  { date: 'Wed', views: 15800, likes: 1100, comments: 150 },
  { date: 'Thu', views: 22100, likes: 1580, comments: 210 },
  { date: 'Fri', views: 19500, likes: 1400, comments: 195 },
  { date: 'Sat', views: 28300, likes: 2100, comments: 280 },
  { date: 'Sun', views: 24700, likes: 1750, comments: 245 },
];

export default function DataOverview() {
  const data = useMemo(() => MOCK_DATA, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Data Overview
      </h3>
      <div className="h-48 min-h-[192px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={192}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a0b0f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#viewsGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}
