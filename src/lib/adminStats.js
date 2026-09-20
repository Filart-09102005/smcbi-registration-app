import { supabase } from './supabaseClient'

export async function fetchDistribution() {
  const { data, error } = await supabase.rpc('registration_distribution')
  if (error) throw error

  const byDimension = {}
  for (const row of data ?? []) {
    if (!byDimension[row.dimension]) byDimension[row.dimension] = []
    byDimension[row.dimension].push({ label: row.value, count: Number(row.count) })
  }
  return byDimension
}
