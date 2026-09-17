const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-primary-200 bg-primary-50 text-primary-900',
}

export default function Alert({ variant = 'info', children }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`} role="alert">
      {children}
    </div>
  )
}
