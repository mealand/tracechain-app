import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { Loader2 } from 'lucide-react'

// Blocks unauthenticated users and optionally restricts to specific roles
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-display font-medium text-textSecondary">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login, remembering where they were trying to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Role-based access control (used for admin-only routes)
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
