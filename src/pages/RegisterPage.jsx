import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalShell from '../components/layout/PortalShell'
import ProgressSteps from '../components/ProgressSteps'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import StepRoleDepartment from '../components/steps/StepRoleDepartment'
import StepAcademic from '../components/steps/StepAcademic'
import StepPersonal from '../components/steps/StepPersonal'
import StepAccount from '../components/steps/StepAccount'
import StepReview from '../components/steps/StepReview'
import {
  validateStepRoleDepartment,
  validateStepAcademic,
  validateStepPersonal,
  validateStepAccount,
} from '../lib/validation'
import { isSeniorHigh } from '../lib/academicOptions'
import { DuplicateBarcodeError, DuplicateEmailError, RateLimitedError, submitRegistration } from '../lib/registrations'
import { isSupabaseConfigured } from '../lib/supabaseClient'

const INITIAL_FORM_DATA = {
  role: 'student',
  department: '',
  program: '',
  yearLevel: '',
  gradeLevel: '',
  strand: '',
  firstName: '',
  lastName: '',
  schoolId: '',
  email: '',
  birthday: '',
  gender: '',
  password: '',
  confirmPassword: '',
}

const TOTAL_STEPS = 5

// Bot deterrents, not the actual security boundary - that's the per-IP rate
// limit enforced in the database (see migration-005-security-hardening.sql).
// A hidden field no human ever sees or fills, and a form no human fills in
// under a few seconds. Both are trivially bypassed by anyone who bothers to
// read the page source, which is exactly why the database still enforces
// its own limit regardless of what these catch.
const MIN_FILL_MS = 3000

const STEP_SUBTITLES = [
  'Choose your role and department',
  'Tell us your academic information',
  'Complete your personal details',
  'Create your account password',
  'Review and submit your registration',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState({})
  const [emailStatus, setEmailStatus] = useState({ state: 'idle', message: '' })
  const [barcodeStatus, setBarcodeStatus] = useState({ state: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const startedAtRef = useRef(null)

  // Date.now() is impure, so it can't be read directly during render - set
  // once, on mount, same as the timer it feeds.
  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  function setField(name, value) {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'role' || name === 'department') {
        next.program = ''
        next.yearLevel = ''
        next.gradeLevel = ''
        next.strand = ''
      }
      if (name === 'role') {
        next.department = ''
      }
      if (name === 'gradeLevel' && !isSeniorHigh(value)) {
        next.strand = ''
      }
      return next
    })

    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      if (name === 'role' || name === 'department') {
        delete next.program
        delete next.yearLevel
        delete next.gradeLevel
        delete next.strand
      }
      if (name === 'role') {
        delete next.department
      }
      if (name === 'gradeLevel') {
        delete next.strand
      }
      return next
    })
  }

  function handleBack() {
    if (step === 1) {
      navigate('/')
      return
    }
    setSubmitError('')
    setStep((prev) => prev - 1)
  }

  function handleContinue() {
    let stepErrors = {}

    if (step === 1) stepErrors = validateStepRoleDepartment(formData)
    if (step === 2) stepErrors = validateStepAcademic(formData)
    if (step === 3) {
      stepErrors = validateStepPersonal(formData)
      if (!stepErrors.email) {
        if (emailStatus.state === 'checking') {
          stepErrors.email = 'Please wait while we verify your email.'
        } else if (emailStatus.state === 'taken') {
          stepErrors.email = emailStatus.message
        }
      }
      if (!stepErrors.schoolId) {
        if (barcodeStatus.state === 'checking') {
          stepErrors.schoolId = 'Please wait while we verify your School ID.'
        } else if (barcodeStatus.state === 'taken') {
          stepErrors.schoolId = barcodeStatus.message
        }
      }
    }
    if (step === 4) stepErrors = validateStepAccount(formData)

    setErrors(stepErrors)
    if (Object.keys(stepErrors).length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setStep((prev) => prev + 1)
    }
  }

  async function handleSubmit() {
    setSubmitError('')

    // A filled honeypot or an implausibly fast submission is treated as a
    // bot, not an error - fake the same success a real submission gets
    // (without ever calling submitRegistration) so nothing here tips off an
    // automated client that it was caught, and it doesn't just retry harder.
    if (honeypot.trim() || Date.now() - startedAtRef.current < MIN_FILL_MS) {
      navigate('/success', { state: { firstName: formData.firstName } })
      return
    }

    setSubmitting(true)
    try {
      await submitRegistration(formData)
      navigate('/success', { state: { firstName: formData.firstName } })
    } catch (error) {
      if (
        error instanceof DuplicateEmailError ||
        error instanceof DuplicateBarcodeError ||
        error instanceof RateLimitedError
      ) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Something went wrong while submitting your registration. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <PortalShell eyebrow="Registration" title="Create account">
        <Alert variant="error">
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file, then restart the dev
          server.
        </Alert>
      </PortalShell>
    )
  }

  return (
    <PortalShell
      eyebrow="Registration"
      title="Create account"
      subtitle={`Step ${step} of ${TOTAL_STEPS} - ${STEP_SUBTITLES[step - 1]}`}
    >
      {/* Honeypot: invisible to a real visitor (off-screen, unreachable by
          Tab, excluded from screen readers), but a naive bot that
          autofills every input on the page will fill it. Bait name chosen
          to read as a normal field to something scanning the DOM. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      >
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <ProgressSteps currentStep={step} />

      <div className="rounded-xl border p-5 auth-panel sm:p-8">
        {step === 1 && (
          <StepRoleDepartment formData={formData} errors={errors} setField={setField} />
        )}
        {step === 2 && <StepAcademic formData={formData} errors={errors} setField={setField} />}
        {step === 3 && (
          <StepPersonal
            formData={formData}
            errors={errors}
            setField={setField}
            emailStatus={emailStatus}
            setEmailStatus={setEmailStatus}
            barcodeStatus={barcodeStatus}
            setBarcodeStatus={setBarcodeStatus}
          />
        )}
        {step === 4 && <StepAccount formData={formData} errors={errors} setField={setField} />}
        {step === 5 && <StepReview formData={formData} submitError={submitError} />}

        <div
          className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between"
          style={{ borderColor: 'var(--auth-border)' }}
        >
          <Button variant="secondary" onClick={handleBack} disabled={submitting}>
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={handleContinue}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              Submit Registration
            </Button>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
