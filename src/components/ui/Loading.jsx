export function Loading() {
  return (
    <div className="flex items-center justify-center p-12" role="status" aria-label="Loading">
      <span className="inline-block w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
    </div>
  );
}