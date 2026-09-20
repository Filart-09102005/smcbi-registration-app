export default function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 text-xs font-semibold" style={{ color: 'var(--color-error)' }} role="alert">
      {children}
    </p>
  )
}
