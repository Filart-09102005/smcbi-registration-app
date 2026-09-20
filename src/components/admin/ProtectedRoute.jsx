import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/useAdminAuth'

export default function ProtectedRoute({ children }) {
  const { loading, session, isAdmin } = useAdminAuth()

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-muted)' }}
      >
        <p className="text-sm font-semibold">Checking your session...</p>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
