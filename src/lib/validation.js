import { isSeniorHigh } from './academicOptions'

const SCHOOL_EMAIL_DOMAIN = '@smcbi.edu.ph'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateStepRoleDepartment(formData) {
  const errors = {}
  if (!formData.role) errors.role = 'Please select your role.'
  if (!formData.department) errors.department = 'Please select your department.'
  return errors
}

export function validateStepAcademic(formData) {
  const errors = {}

  if (formData.role === 'personnel') {
    if (!formData.department) errors.department = 'Please select your department.'
    return errors
  }

  if (formData.department === 'COLLEGE') {
    if (!formData.program) errors.program = 'Please select your program/course.'
    if (!formData.yearLevel) errors.yearLevel = 'Please select your year level.'
  } else if (formData.department === 'BED') {
    if (!formData.gradeLevel) {
      errors.gradeLevel = 'Please select your grade level.'
    } else if (isSeniorHigh(formData.gradeLevel) && !formData.strand) {
      errors.strand = 'Please select your strand.'
    }
  } else {
    errors.department = 'Please select your department.'
  }

  return errors
}

export function isValidSchoolEmail(email) {
  const value = (email || '').trim().toLowerCase()
  if (!EMAIL_REGEX.test(value)) return false
  return value.endsWith(SCHOOL_EMAIL_DOMAIN)
}

export function isValidBirthday(birthday) {
  if (!birthday) return false
  const date = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function calculateAge(birthday) {
  if (!isValidBirthday(birthday)) return null
  const dob = new Date(`${birthday}T00:00:00`)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function validateStepPersonal(formData) {
  const errors = {}

  if (!formData.firstName.trim()) errors.firstName = 'Please enter your first name.'
  if (!formData.lastName.trim()) errors.lastName = 'Please enter your last name.'

  if (!formData.schoolId.trim()) {
    errors.schoolId = 'Please enter your School ID.'
  }

  if (!formData.email.trim()) {
    errors.email = 'Please enter your school email.'
  } else if (!isValidSchoolEmail(formData.email)) {
    errors.email = `Please use a valid ${SCHOOL_EMAIL_DOMAIN} email address.`
  }

  if (!formData.birthday) {
    errors.birthday = 'Please enter your birthday.'
  } else if (!isValidBirthday(formData.birthday)) {
    errors.birthday = 'Please enter a valid birthday before today.'
  }

  if (!formData.gender) errors.gender = 'Please select your gender.'

  return errors
}

export { SCHOOL_EMAIL_DOMAIN }
