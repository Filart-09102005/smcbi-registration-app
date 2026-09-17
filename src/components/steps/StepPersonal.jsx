import { useEffect, useRef } from 'react'
import TextField from '../ui/TextField'
import OptionCards from '../ui/OptionCards'
import { GENDERS } from '../../lib/academicOptions'
import { calculateAge, isValidSchoolEmail } from '../../lib/validation'
import { checkEmailExists } from '../../lib/registrations'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

const TODAY = new Date().toISOString().split('T')[0]

export default function StepPersonal({
  formData,
  errors,
  setField,
  emailStatus,
  setEmailStatus,
}) {
  const lastChecked = useRef('')

  useEffect(() => {
    const email = formData.email.trim().toLowerCase()

    if (!isValidSchoolEmail(email)) {
      setEmailStatus({ state: 'idle', message: '' })
      return undefined
    }

    if (email === lastChecked.current) return undefined

    setEmailStatus({ state: 'checking', message: 'Checking availability…' })

    const timer = setTimeout(async () => {
      if (!isSupabaseConfigured) {
        setEmailStatus({ state: 'idle', message: '' })
        return
      }
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000),
        )
        const exists = await Promise.race([checkEmailExists(email), timeout])
        lastChecked.current = email
        setEmailStatus(
          exists
            ? { state: 'taken', message: 'This school email has already been registered.' }
            : { state: 'available', message: 'Email is available.' },
        )
      } catch {
        setEmailStatus({ state: 'error', message: 'Could not verify email right now.' })
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email])

  const age = calculateAge(formData.birthday)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">Enter your personal details.</p>
      </div>

      <TextField
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={setField}
        error={errors.firstName}
        autoComplete="given-name"
      />

      <TextField
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={setField}
        error={errors.lastName}
        autoComplete="family-name"
      />

      <TextField
        label="School Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={setField}
        error={errors.email || (emailStatus.state === 'taken' ? emailStatus.message : '')}
        placeholder="juan.delacruz@smcbi.edu.ph"
        autoComplete="email"
        helperText={
          !errors.email && emailStatus.state !== 'taken'
            ? emailStatus.message || 'Use your official @smcbi.edu.ph email address.'
            : ''
        }
      />

      <TextField
        label="Birthday"
        name="birthday"
        type="date"
        value={formData.birthday}
        onChange={setField}
        error={errors.birthday}
        max={TODAY}
        helperText={age !== null ? `Age: ${age} years old` : ''}
      />

      <OptionCards
        label="Gender"
        name="gender"
        options={GENDERS}
        value={formData.gender}
        onChange={setField}
        error={errors.gender}
      />
    </div>
  )
}
