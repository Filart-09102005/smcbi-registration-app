import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Info, UserPlus } from 'lucide-react'
import Button from '../components/ui/Button'
import PortalShell from '../components/layout/PortalShell'

export default function SuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state

  useEffect(() => {
    if (!state) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state) return null

  return (
    <PortalShell eyebrow="Success" title="Thank you!">
      <div className="flex flex-col items-center rounded-xl border p-8 text-center auth-panel">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success), transparent 85%)',
            color: 'var(--color-success)',
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        <p className="mt-6 max-w-sm text-base font-semibold leading-7 auth-strong-text">
          {state.firstName ? `Thank you, ${state.firstName}! ` : 'Thank you! '}
          We appreciate you registering with the SMCBI Health Kiosk. Your information has been
          received successfully.
        </p>

        <div
          className="mt-6 flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 text-left"
          style={{
            borderColor: 'var(--color-primary)',
            backgroundColor: 'color-mix(in srgb, var(--color-primary), transparent 92%)',
          }}
        >
          <Info size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-semibold leading-6 auth-strong-text">
            No password needed here — this is a pre-registration only. Once it's reviewed and
            approved, your Health Kiosk account will be created for you. Ask the clinic for your
            login details once that's ready.
          </p>
        </div>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={() => navigate('/register')}>
            <UserPlus size={18} />
            Register Another
          </Button>
        </div>

        <p className="mt-6 text-sm font-semibold auth-muted-text">
          You may now close this page, or register another student above.
        </p>
      </div>
    </PortalShell>
  )
}
