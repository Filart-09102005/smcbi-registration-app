import { useEffect, useRef } from 'react'
import { IdCard, Mail, UserRound } from 'lucide-react'
import TextField from '../ui/TextField'
import OptionCards from '../ui/OptionCards'
import BirthdayPicker from '../ui/BirthdayPicker'
import { GENDERS } from '../../lib/academicOptions'
import { calculateAge, isValidSchoolEmail } from '../../lib/validation'
import { checkBarcodeExists, checkEmailExists } from '../../lib/registrations'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function StepPersonal({
  formData,
  errors,
  setField,
  emailStatus,
  setEmailStatus,
  barcodeStatus,
  setBarcodeStatus,
}) {
  const lastChecked = useRef('')
  const lastCheckedBarcode = useRef('')

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

  useEffect(() => {
    const barcode = formData.schoolId.trim()

    if (!barcode) {
      setBarcodeStatus({ state: 'idle', message: '' })
      return undefined
    }

    if (barcode === lastCheckedBarcode.current) return undefined

    setBarcodeStatus({ state: 'checking', message: 'Checking availability…' })

    const timer = setTimeout(async () => {
      if (!isSupabaseConfigured) {
        setBarcodeStatus({ state: 'idle', message: '' })
        return
      }
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000),
        )
        const exists = await Promise.race([checkBarcodeExists(barcode), timeout])
        lastCheckedBarcode.current = barcode
        setBarcodeStatus(
          exists
            ? { state: 'taken', message: 'This School ID has already been registered.' }
            : { state: 'available', message: 'School ID is available.' },
        )
      } catch {
        setBarcodeStatus({ state: 'error', message: 'Could not verify School ID right now.' })
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.schoolId])

  const age = calculateAge(formData.birthday)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black auth-strong-text">Personal Information</h2>
        <p className="mt-1 text-sm font-semibold auth-muted-text">Enter your personal details.</p>
      </div>

      <TextField
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={setField}
        error={errors.firstName}
        autoComplete="given-name"
        icon={UserRound}
      />

      <TextField
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={setField}
        error={errors.lastName}
        autoComplete="family-name"
        icon={UserRound}
      />

      <TextField
        label="School ID"
        name="schoolId"
        value={formData.schoolId}
        onChange={setField}
        error={errors.schoolId || (barcodeStatus.state === 'taken' ? barcodeStatus.message : '')}
        placeholder="e.g. 21-0001"
        autoComplete="off"
        icon={IdCard}
        helperText={
          !errors.schoolId && barcodeStatus.state !== 'taken'
            ? barcodeStatus.message || 'This is the same ID printed as the barcode on your school ID card.'
            : ''
        }
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
        icon={Mail}
        helperText={
          !errors.email && emailStatus.state !== 'taken'
            ? emailStatus.message || 'Use your official @smcbi.edu.ph email address.'
            : ''
        }
      />

      <BirthdayPicker
        label="Birthday"
        name="birthday"
        value={formData.birthday}
        onChange={setField}
        error={errors.birthday}
        badge={
          age !== null ? (
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {age} years old
            </span>
          ) : null
        }
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
