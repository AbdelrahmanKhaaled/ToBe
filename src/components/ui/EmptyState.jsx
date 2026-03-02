export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-lg font-medium text-[var(--color-primary)]">{title}</p>
      {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-accent)] text-white font-medium hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
