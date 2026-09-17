import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
    <PortalShell>
      <div className="flex flex-col items-center py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">Registration Submitted</h1>
        <p className="mt-3 max-w-sm text-base text-gray-600">
          {state.firstName ? `Thank you, ${state.firstName}. ` : ''}Your student registration has
          been successfully submitted.
        </p>
        <p className="mt-2 max-w-sm text-base text-gray-600">
          Your information will be processed for the SMCBI Health Kiosk.
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Registration Status
          </p>
          <span className="mt-2 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-amber-800">
            Pending
          </span>
        </div>

        <p className="mt-10 text-sm text-gray-400">You may now close this page.</p>
      </div>
    </PortalShell>
  )
}
