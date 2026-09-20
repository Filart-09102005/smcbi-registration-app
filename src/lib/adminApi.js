import { supabase } from './supabaseClient'

const TABLE = 'student_registrations'

// Never select password_hash - nothing in the admin UI should ever be able
// to render it, so it is simply never fetched.
const SAFE_COLUMNS =
  'id, role, firstname, lastname, barcode, email, birthday, gender, department, program, ' +
  'year_level, grade_level, strand, status, submitted_at, reviewed_at, imported_at'

export async function fetchStats() {
  const { data, error } = await supabase.rpc('registration_stats')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * @param {object} opts
 * @param {string} [opts.search] matched against name/email
 * @param {object} [opts.filters] department/program/yearLevel/gradeLevel/strand/gender/status/role
 * @param {{column: string, ascending: boolean}} [opts.sort]
 * @param {number} [opts.page] 1-based
 * @param {number} [opts.pageSize]
 */
export async function fetchRegistrations({
  search = '',
  filters = {},
  sort = { column: 'submitted_at', ascending: false },
  page = 1,
  pageSize = 25,
} = {}) {
  let query = supabase.from(TABLE).select(SAFE_COLUMNS, { count: 'exact' })

  if (search.trim()) {
    const term = search.trim().replace(/[%_]/g, (match) => `\\${match}`)
    query = query.or(
      `firstname.ilike.%${term}%,lastname.ilike.%${term}%,email.ilike.%${term}%,barcode.ilike.%${term}%`,
    )
  }

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const column = { yearLevel: 'year_level', gradeLevel: 'grade_level' }[key] ?? key
    query = query.eq(column, value)
  }

  query = query.order(sort.column, { ascending: sort.ascending })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

/** Every row matching the same search/filters, unpaginated - for exports. */
export async function fetchAllMatching({ search = '', filters = {} } = {}) {
  let query = supabase.from(TABLE).select(SAFE_COLUMNS)

  if (search.trim()) {
    const term = search.trim().replace(/[%_]/g, (match) => `\\${match}`)
    query = query.or(
      `firstname.ilike.%${term}%,lastname.ilike.%${term}%,email.ilike.%${term}%,barcode.ilike.%${term}%`,
    )
  }

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const column = { yearLevel: 'year_level', gradeLevel: 'grade_level' }[key] ?? key
    query = query.eq(column, value)
  }

  const { data, error } = await query.order('lastname', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchRegistrationById(id) {
  const { data, error } = await supabase.from(TABLE).select(SAFE_COLUMNS).eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateStatus(id, status) {
  const { data: userData } = await supabase.auth.getUser()

  const patch = { status }
  if (status === 'approved' || status === 'rejected') {
    patch.reviewed_at = new Date().toISOString()
    patch.reviewed_by = userData?.user?.id ?? null
  }
  if (status === 'imported') {
    patch.imported_at = new Date().toISOString()
  }

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
}

export async function updateRegistration(id, patch) {
  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteRegistration(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function markManyImported(ids) {
  if (ids.length === 0) return
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'imported', imported_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

export async function fetchApprovedForExport() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SAFE_COLUMNS)
    .eq('status', 'approved')
    .order('department', { ascending: true })
    .order('lastname', { ascending: true })

  if (error) throw error
  return data ?? []
}
