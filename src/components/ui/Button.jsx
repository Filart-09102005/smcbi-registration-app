const VARIANTS = {
  primary:
    'bg-primary-800 text-white hover:bg-primary-900 disabled:bg-gray-300 disabled:text-gray-500',
  secondary:
    'bg-white text-primary-800 border border-primary-800 hover:bg-primary-50 disabled:border-gray-300 disabled:text-gray-400',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
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
      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed sm:w-auto ${VARIANTS[variant]} ${className}`}
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
