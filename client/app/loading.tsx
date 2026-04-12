export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm text-zinc-200">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-r-transparent" />
        Loading marketplace data...
      </div>
    </div>
  );
}
