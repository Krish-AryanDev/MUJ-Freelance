import Link from 'next/link';

import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-5 px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Error 404</p>
      <h1 className="text-3xl font-bold text-white sm:text-4xl">The page you requested was not found</h1>
      <p className="text-sm text-zinc-300 sm:text-base">
        It may have been moved, removed, or the URL might be incorrect.
      </p>
      <Link href="/">
        <Button size="lg">Return to Home</Button>
      </Link>
    </div>
  );
}
