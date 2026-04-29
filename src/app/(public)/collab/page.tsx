import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

export default function CollabPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Collaboration</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Work With Me</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Interested in collaboration? Fill out the form below and I&apos;ll get back to you.
        </p>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Brand / Company</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gaming-purple"
              placeholder="Your brand name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Budget Range</label>
            <select className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gaming-purple">
              <option value="">Select range</option>
              <option>Under $1,000</option>
              <option>$1,000 - $5,000</option>
              <option>$5,000 - $10,000</option>
              <option>$10,000+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Description</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gaming-purple resize-none"
              placeholder="Describe your project..."
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full gradient-gaming px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" />
            Submit Inquiry
          </button>
        </form>
      </main>
    </div>
  );
}
