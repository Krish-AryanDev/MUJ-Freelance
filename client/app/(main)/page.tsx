'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import EmptyState from '../../components/shared/EmptyState';
import SearchBar from '../../components/shared/SearchBar';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

const featuredCategories = [
  { name: 'Web Development', gigs: 231 },
  { name: 'UI/UX Design', gigs: 146 },
  { name: 'Content Writing', gigs: 98 },
  { name: 'Video Editing', gigs: 67 },
  { name: 'Data & AI', gigs: 52 },
];

export default function HomePage() {
  const [query, setQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!query) {
      return featuredCategories;
    }

    const normalized = query.toLowerCase();
    return featuredCategories.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/40 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">MUJ Freelance</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
          Hire faster. Deliver better. Scale freelance work without chaos.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
          Discover skilled freelancers, launch projects, and manage orders in one collaborative workspace built for modern teams.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/gigs">
            <Button size="lg">Browse Gigs</Button>
          </Link>
          <Link href="/projects">
            <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-100 hover:bg-zinc-800">
              Explore Projects
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Featured Categories</h2>
          <span className="text-xs uppercase tracking-wide text-zinc-400">Live opportunities</span>
        </div>

        <SearchBar
          placeholder="Search categories..."
          onSearch={setQuery}
          className="max-w-xl"
          debounceMs={250}
        />

        {filteredCategories.length === 0 ? (
          <EmptyState
            title="No category matches"
            description="Try another keyword to discover available gigs and projects."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.name} className="border-zinc-800 bg-zinc-900/80 text-zinc-100">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription className="text-zinc-400">Trending freelance domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300">{category.gigs}+ open gigs waiting for proposals.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
