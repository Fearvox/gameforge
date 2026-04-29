import Link from 'next/link';
import { Play, Users, Eye, Award } from 'lucide-react';

const STATS = [
  { label: 'Followers', value: '128.5K', icon: Users },
  { label: 'Total Views', value: '3.2M', icon: Eye },
  { label: 'Brand Collabs', value: '24', icon: Award },
];

const FEATURED_VIDEOS = [
  { title: '原神 4.5 全角色强度榜', views: '523K', duration: '12:34', published: '3d ago' },
  { title: '崩铁 2.3 新角色测评', views: '341K', duration: '8:21', published: '1w ago' },
  { title: '鸣潮终测全攻略', views: '287K', duration: '15:42', published: '2w ago' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-gaming flex items-center justify-center text-white font-bold text-sm">
              GF
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Player One
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-foreground">
              Home
            </Link>
            <Link href="/videos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Videos
            </Link>
            <Link href="/collab" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Collab
            </Link>
            <Link
              href="/dashboard"
              className="ml-2 rounded-full gradient-gaming px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Enter Studio
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-gaming opacity-5" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="mb-6 h-24 w-24 rounded-full gradient-gaming p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-3xl">
                🎮
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Player One
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Gaming content creator · Strategy guides & character reviews
            </p>

            {/* Platform badges */}
            <div className="mt-4 flex items-center gap-3">
              {['Bilibili', 'YouTube', 'Douyin'].map((p) => (
                <span
                  key={p}
                  className="rounded-full glass-card px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <Link
                href="/dashboard"
                className="rounded-full gradient-gaming px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Enter Studio
              </Link>
              <p className="text-xs text-muted-foreground">Login required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-6 py-6">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Videos */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Featured Videos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_VIDEOS.map((vid) => (
            <div
              key={vid.title}
              className="group glass-card overflow-hidden rounded-xl transition-transform hover:-translate-y-1"
            >
              {/* Thumbnail placeholder */}
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                <Play className="h-10 w-10 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-mono text-foreground">
                  {vid.duration}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {vid.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vid.views} views · {vid.published}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-muted-foreground">
          Built with GameForge · Player One Studio
        </div>
      </footer>
    </div>
  );
}
