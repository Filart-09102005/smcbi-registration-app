import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import PortalShell from '../components/layout/PortalShell'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <PortalShell>
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-800 text-2xl font-bold text-white">
          S
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
          SMCBI Student Pre-Registration
        </h1>
        <p className="mt-3 max-w-md text-base text-gray-600">
          Register your student information online. Your details will be reviewed and used to
          prepare your account for the SMCBI Health Kiosk.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-6 w-full text-left">
            <Alert variant="error">
              Supabase is not configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file before
              registrations can be submitted.
            </Alert>
          </div>
        )}

        <div className="mt-8 w-full max-w-xs">
          <Button onClick={() => navigate('/register')} className="w-full">
            Start Registration
          </Button>
        </div>

        <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white p-5 text-left">
          <h2 className="text-sm font-semibold text-gray-900">Before you begin</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• You will need your official @smcbi.edu.ph school email.</li>
            <li>• Have your program/course or grade level and strand ready.</li>
            <li>• The process takes about 3–5 minutes to complete.</li>
          </ul>
        </div>
      </div>
    </PortalShell>
  )
}
