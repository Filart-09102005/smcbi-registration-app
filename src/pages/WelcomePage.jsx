import { useNavigate } from 'react-router-dom'
import { ArrowRight, ListChecks } from 'lucide-react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import PortalShell from '../components/layout/PortalShell'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <PortalShell eyebrow="Get Started" title="Start your pre-registration">
      <div className="space-y-6">
        <p className="text-base font-semibold leading-7 auth-muted-text">
          Submit your student information online — no password needed. Once it's reviewed and
          approved, your account will be created for you on the SMCBI Health Kiosk.
        </p>

        {!isSupabaseConfigured && (
          <Alert variant="error">
            Supabase is not configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file before
            registrations can be submitted.
          </Alert>
        )}

        <div className="rounded-xl border p-5 auth-panel">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ListChecks size={20} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-sm font-black auth-strong-text">Before you begin</h2>
            </div>
            <span
              className="flex-shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-error), transparent 88%)',
                color: 'var(--color-error)',
              }}
            >
              Required
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold auth-muted-text">
            Please read this before you start — you'll need these ready to complete registration.
          </p>
          <ul className="mt-4 space-y-2 text-sm font-semibold auth-muted-text">
            <li>&bull; You will need your official @smcbi.edu.ph school email.</li>
            <li>&bull; Have your program/course or grade level and strand ready.</li>
            <li>&bull; The process takes about 3-5 minutes to complete.</li>
          </ul>
        </div>

        <Button onClick={() => navigate('/register')} className="w-full">
          Start Registration
          <ArrowRight size={18} />
        </Button>
      </div>
    </PortalShell>
  )
}
