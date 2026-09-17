export const DEPARTMENTS = [
  { value: 'COLLEGE', label: 'College' },
  { value: 'BED', label: 'Basic Education (BED)' },
]

export const PROGRAMS = [
  { value: 'BSIT', label: 'BSIT' },
  { value: 'BSED', label: 'BSED' },
  { value: 'BEED', label: 'BEED' },
  { value: 'BSHM', label: 'BSHM' },
  { value: 'BSBA', label: 'BSBA' },
]

export const YEAR_LEVELS = [
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' },
]

export const GRADE_LEVELS = [
  { value: 'Grade 7', label: 'Grade 7' },
  { value: 'Grade 8', label: 'Grade 8' },
  { value: 'Grade 9', label: 'Grade 9' },
  { value: 'Grade 10', label: 'Grade 10' },
  { value: 'Grade 11', label: 'Grade 11' },
  { value: 'Grade 12', label: 'Grade 12' },
]

export const SENIOR_HIGH_GRADES = ['Grade 11', 'Grade 12']

export const STRANDS = [
  { value: 'ABM', label: 'ABM' },
  { value: 'HUMSS', label: 'HUMSS' },
  { value: 'STEM', label: 'STEM' },
]

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export function isSeniorHigh(gradeLevel) {
  return SENIOR_HIGH_GRADES.includes(gradeLevel)
}

export function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}
