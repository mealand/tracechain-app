import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null) // Supabase Auth user
  const [entity, setEntity]   = useState(null) // TraceChain entity record
  const [loading, setLoading] = useState(true)

  // Fetch the entity record linked to a Supabase Auth user ID
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

  // Sign in via Supabase Auth — passwords are now hashed by Supabase (bcrypt)
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

  // Sign out via Supabase Auth
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setEntity(null)
  }

  // Restore session on page load + subscribe to auth state changes
  useEffect(() => {
    // Check for an existing session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const entityData = await fetchEntity(session.user.id)
        setEntity(entityData)
      }
      setLoading(false)
    })

    // Keep state in sync with Supabase Auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const entityData = await fetchEntity(session.user.id)
          setEntity(entityData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setEntity(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently refresh entity data on token refresh
          const entityData = await fetchEntity(session.user.id)
          setEntity(entityData)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    entity,
    loading,
    signIn,
    signOut,
    fetchEntity,
    isAuthenticated:     !!entity,
    role:                entity?.role               || null,
    nexusId:             entity?.nexus_id           || null,
    verificationStatus:  entity?.verification_status || null,
    isAdmin:             entity?.role === 'admin',
    isInspector:         entity?.role === 'inspector',
    isPending:           entity?.verification_status === 'pending',
    isSuspended:         entity?.verification_status === 'suspended',
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