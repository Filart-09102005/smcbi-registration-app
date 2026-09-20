import { supabase } from './supabaseClient'

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOutAdmin() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Whether the signed-in user is a member of admin_users.
 *
 * Goes through the is_admin() RPC rather than selecting admin_users
 * directly - the table itself only grants a user permission to read their
 * own row, and the RPC is the one path guaranteed to exist regardless of
 * how that policy is shaped.
 */
export async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return Boolean(data)
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
