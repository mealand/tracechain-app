import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)         // Supabase auth user
  const [entity, setEntity] = useState(null)     // TraceChain entity record
  const [loading, setLoading] = useState(true)   // Initial session check

  // Fetch the entity record that matches the logged-in user's email
  const fetchEntity = async (email) => {
    if (!email) return null
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('email', email)
      .single()
    if (error) {
      console.error('Entity fetch error:', error.message)
      return null
    }
    return data
  }

  // Sign in with email + password (matched against entities table)
  const signIn = async (email, password) => {
    // Look up entity by email
    const { data: entityData, error: lookupError } = await supabase
      .from('entities')
      .select('*')
      .eq('email', email)
      .single()

    if (lookupError || !entityData) {
      return { error: 'No account found with that email address.' }
    }

    // Simple password check (MVP: comparing plain text — in production use bcrypt via Edge Function)
    // For now we store password_hash as plain text during registration for demo purposes
    if (entityData.password_hash !== password) {
      return { error: 'Incorrect password. Please try again.' }
    }

    // Check verification status
    if (entityData.verification_status === 'rejected') {
      return { error: 'Your account has been rejected. Please contact support.' }
    }

    if (entityData.verification_status === 'suspended') {
      return { error: 'Your account has been suspended. Please contact support.' }
    }

    // Set session in state
    setEntity(entityData)
    setUser({ email: entityData.email, id: entityData.id })

    // Persist session in sessionStorage
    sessionStorage.setItem('tc_entity', JSON.stringify(entityData))

    return { success: true, entity: entityData }
  }

  // Sign out
  const signOut = () => {
    setUser(null)
    setEntity(null)
    sessionStorage.removeItem('tc_entity')
  }

  // Restore session on page load
  useEffect(() => {
    const stored = sessionStorage.getItem('tc_entity')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setEntity(parsed)
        setUser({ email: parsed.email, id: parsed.id })
      } catch {
        sessionStorage.removeItem('tc_entity')
      }
    }
    setLoading(false)
  }, [])

  const value = {
    user,
    entity,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!entity,
    role: entity?.role || null,
    nexusId: entity?.nexus_id || null,
    verificationStatus: entity?.verification_status || null,
    isAdmin: entity?.role === 'admin',
    isInspector: entity?.role === 'inspector',
    isPending: entity?.verification_status === 'pending',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
