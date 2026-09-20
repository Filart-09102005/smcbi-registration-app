import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAdminAuth } from '../../context/useAdminAuth'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function AdminLoginPage() {
  const { loading, session, isAdmin, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      // Never surface the raw Supabase error - only these two cases carry
      // anything a user needs to act on; everything else (network errors,
      // unexpected Auth responses) could otherwise leak internal details.
      if (err?.message === 'Invalid login credentials') {
        setError('Incorrect email or password.')
      } else if (err?.message === 'This account is not authorized to access the admin dashboard.') {
        setError(err.message)
      } else {
        setError('Could not sign in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
          >
            <GraduationCap size={26} />
          </div>
          <p
            className="mt-4 text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-muted)' }}
          >
            SMCBI Student Registration
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Admin Login
          </h1>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          {!isSupabaseConfigured && (
            <div className="mb-4">
              <Alert variant="error">
                Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
              </Alert>
            </div>
          )}

          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                Email
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg border px-3.5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <Mail size={17} style={{ color: 'var(--color-muted)' }} />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                Password
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg border px-3.5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <Lock size={17} style={{ color: 'var(--color-muted)' }} />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="flex-shrink-0 rounded-md p-1"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={submitting}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
          Admin accounts are provisioned manually. Contact the system administrator if you need
          access.
        </p>
      </div>
    </div>
  )
}
