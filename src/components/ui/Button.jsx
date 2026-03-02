import { forwardRef } from 'react';

const variantStyles = {
  primary: 'bg-[var(--color-accent)] text-white hover:opacity-90',
  secondary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-border)]',
};

export const Button = forwardRef(({ variant = 'primary', loading, disabled, className = '', children, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius)] font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    {...props}
  >
    {loading ? (
      <>
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading...
      </>
    ) : (
      children
    )}
  </button>
));

Button.displayName = 'Button';
