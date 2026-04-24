import { clsx } from 'clsx';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm',
  secondary: 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-600 border-transparent',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      style={{
        fontFamily: 'inherit',
      }}
      {...props}
    >
      {loading && (
        <span
          className="animate-spin"
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}
