import { useEffect, useState } from 'react'
import { checkIsAdmin, getSession, onAuthStateChange, signInAdmin, signOutAdmin } from '../lib/adminAuth'
import { AdminAuthContext } from './adminAuthContextInstance'

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function resolve(nextSession) {
    setSession(nextSession)
    if (!nextSession) {
      setIsAdmin(false)
      return
    }
    try {
      setIsAdmin(await checkIsAdmin())
    } catch {
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    getSession().then(async (initial) => {
      if (cancelled) return
      await resolve(initial)
      setLoading(false)
    })

    const unsubscribe = onAuthStateChange(async (next) => {
      if (cancelled) return
      await resolve(next)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const next = await signInAdmin(email, password)
    await resolve(next)

    if (!(await checkIsAdmin())) {
      await signOutAdmin()
      setSession(null)
      setIsAdmin(false)
      throw new Error('This account is not authorized to access the admin dashboard.')
    }
  }

  async function signOut() {
    await signOutAdmin()
    setSession(null)
    setIsAdmin(false)
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    signIn,
    signOut,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
