import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Videos</h1>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-muted-foreground mb-6">Browse all videos by category and series.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden rounded-xl">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground">Video {i + 1}</p>
                <p className="text-xs text-muted-foreground mt-1">128K views · 3d ago</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
