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

export class DuplicateBarcodeError extends Error {
  constructor() {
    super('This School ID is already registered.')
    this.name = 'DuplicateBarcodeError'
  }
}

export class RateLimitedError extends Error {
  constructor() {
    super('Too many registration attempts from this network. Please try again in a bit.')
    this.name = 'RateLimitedError'
  }
}

export async function checkEmailExists(email) {
  const { data, error } = await supabase.rpc('check_email_exists', {
    p_email: email.trim().toLowerCase(),
  })

  if (error) throw error
  return Boolean(data)
}

export async function checkBarcodeExists(barcode) {
  const { data, error } = await supabase.rpc('check_barcode_exists', {
    p_barcode: barcode.trim(),
  })

  if (error) throw error
  return Boolean(data)
}

export async function submitRegistration(formData) {
  const passwordHash = await bcrypt.hash(formData.password, BCRYPT_ROUNDS)
  const seniorHigh = isSeniorHigh(formData.gradeLevel)
  const isStudent = formData.role !== 'personnel'

  const payload = {
    role: formData.role,
    firstname: formData.firstName.trim(),
    lastname: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    barcode: formData.schoolId.trim(),
    password_hash: passwordHash,
    birthday: formData.birthday,
    gender: formData.gender,
    department: formData.department,
    program: isStudent && formData.department === 'COLLEGE' ? formData.program : null,
    year_level: isStudent && formData.department === 'COLLEGE' ? formData.yearLevel : null,
    grade_level: isStudent && formData.department === 'BED' ? formData.gradeLevel : null,
    strand: isStudent && formData.department === 'BED' && seniorHigh ? formData.strand : null,
    status: 'pending',
  }

  const { error } = await supabase.from('student_registrations').insert(payload)

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      if (error.message?.includes('barcode')) throw new DuplicateBarcodeError()
      throw new DuplicateEmailError()
    }
    if (error.message?.includes('Too many registration attempts')) {
      throw new RateLimitedError()
    }
    throw error
  }
}
