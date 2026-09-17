import bcrypt from 'bcryptjs'
import { isSeniorHigh } from './academicOptions'
import { supabase } from './supabaseClient'

const BCRYPT_ROUNDS = 10
const UNIQUE_VIOLATION = '23505'

export class DuplicateEmailError extends Error {
  constructor() {
    super('This school email has already been registered.')
    this.name = 'DuplicateEmailError'
  }
}

export async function checkEmailExists(email) {
  const { data, error } = await supabase.rpc('check_email_exists', {
    p_email: email.trim().toLowerCase(),
  })

  if (error) throw error
  return Boolean(data)
}

export async function submitRegistration(formData) {
  const passwordHash = await bcrypt.hash(formData.password, BCRYPT_ROUNDS)
  const seniorHigh = isSeniorHigh(formData.gradeLevel)

  const payload = {
    role: 'student',
    firstname: formData.firstName.trim(),
    lastname: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    password_hash: passwordHash,
    birthday: formData.birthday,
    gender: formData.gender,
    department: formData.department,
    program: formData.department === 'COLLEGE' ? formData.program : null,
    year_level: formData.department === 'COLLEGE' ? formData.yearLevel : null,
    grade_level: formData.department === 'BED' ? formData.gradeLevel : null,
    strand: formData.department === 'BED' && seniorHigh ? formData.strand : null,
    status: 'pending',
  }

  const { error } = await supabase.from('student_registrations').insert(payload)

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new DuplicateEmailError()
    }
    throw error
  }
}
