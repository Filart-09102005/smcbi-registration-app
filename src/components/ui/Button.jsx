const VARIANT_STYLE = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--auth-text)',
    borderColor: 'var(--auth-border)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--auth-muted)',
  },
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-base font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto ${className}`}
      style={{
        ...VARIANT_STYLE[variant],
        borderColor: VARIANT_STYLE[variant].borderColor ?? 'transparent',
        boxShadow: variant === 'primary' ? '0 20px 45px color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'none',
      }}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
