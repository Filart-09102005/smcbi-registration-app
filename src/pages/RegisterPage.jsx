import { useState } from 'react'
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
import { DuplicateEmailError, submitRegistration } from '../lib/registrations'
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
  email: '',
  birthday: '',
  gender: '',
  password: '',
  confirmPassword: '',
}

const TOTAL_STEPS = 5

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState({})
  const [emailStatus, setEmailStatus] = useState({ state: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function setField(name, value) {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'department') {
        next.program = ''
        next.yearLevel = ''
        next.gradeLevel = ''
        next.strand = ''
      }
      if (name === 'gradeLevel' && !isSeniorHigh(value)) {
        next.strand = ''
      }
      return next
    })

    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      if (name === 'department') {
        delete next.program
        delete next.yearLevel
        delete next.gradeLevel
        delete next.strand
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
    setSubmitting(true)
    try {
      await submitRegistration(formData)
      navigate('/success', { state: { firstName: formData.firstName } })
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
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
      <PortalShell>
        <Alert variant="error">
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file, then restart the dev
          server.
        </Alert>
      </PortalShell>
    )
  }

  return (
    <PortalShell>
      <ProgressSteps currentStep={step} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
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
          />
        )}
        {step === 4 && <StepAccount formData={formData} errors={errors} setField={setField} />}
        {step === 5 && <StepReview formData={formData} submitError={submitError} />}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
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
