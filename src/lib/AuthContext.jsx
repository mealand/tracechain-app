import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [entity,  setEntity]  = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  const fetchEntity = async (authUserId) => {
    if (!authUserId) return null
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()
    if (error) {
      console.error('Entity fetch error:', error.message)
      return null
    }
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Incorrect email or password. Please try again.' }
      }
      return { error: error.message }
    }

    const entityData = await fetchEntity(data.user.id)

    if (!entityData) {
      await supabase.auth.signOut()
      return { error: 'No TraceChain account is linked to this email. Please register first.' }
    }

    if (entityData.verification_status === 'suspended') {
      await supabase.auth.signOut()
      return { error: 'Your account has been suspended. Please contact support.' }
    }

    setUser(data.user)
    setEntity(entityData)
    return { success: true, entity: entityData }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setEntity(null)
  }

  useEffect(() => {
    isMounted.current = true

    // Step 1 — restore session on page load
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && isMounted.current) {
          const entityData = await fetchEntity(session.user.id)
          if (isMounted.current) {
            setUser(session.user)
            setEntity(entityData)
          }
        }
      } catch (err) {
        console.error('Session restore error:', err.message)
      } finally {
        if (isMounted.current) setLoading(false)
      }
    }

    initAuth()

    // Step 2 — listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setEntity(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const entityData = await fetchEntity(session.user.id)
          if (isMounted.current) {
            setUser(session.user)
            setEntity(entityData)
          }
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    entity,
    loading,
    signIn,
    signOut,
    fetchEntity,
    isAuthenticated:    !!entity,
    role:               entity?.role               || null,
    nexusId:            entity?.nexus_id           || null,
    verificationStatus: entity?.verification_status || null,
    isAdmin:            entity?.role === 'admin',
    isInspector:        entity?.role === 'inspector',
    isPending:          entity?.verification_status === 'pending',
    isSuspended:        entity?.verification_status === 'suspended',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 animate-pulse">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
              fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <p className="text-sm font-display font-semibold text-textSecondary">Loading TraceChain...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

export default AuthContext