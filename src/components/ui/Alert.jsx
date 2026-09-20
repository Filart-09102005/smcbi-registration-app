const VARIANT_COLOR = {
  error: 'var(--color-error)',
  success: 'var(--color-success)',
  info: 'var(--color-primary)',
}

export default function Alert({ variant = 'info', children }) {
  const color = VARIANT_COLOR[variant]

  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm font-semibold"
      style={{
        borderColor: color,
        color,
        backgroundColor: `color-mix(in srgb, ${color}, transparent 90%)`,
      }}
      role="alert"
    >
      {children}
    </div>
  )
}
