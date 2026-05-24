import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

// Public pages
import SelectRolePage from './pages/SelectRolePage.jsx'
import RegistrationPage from './pages/RegistrationPage.jsx'
import RegistrationSuccessPage from './pages/RegistrationSuccessPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

// Protected dashboard pages
import EntityDashboard from './pages/EntityDashboard.jsx'
import InspectorDashboard from './pages/InspectorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

// Role-aware dashboard redirect
function RoleBasedRedirect() {
  const { entity } = useAuth()
  if (!entity) return <Navigate to="/login" replace />
  if (entity.role === 'admin')     return <Navigate to="/dashboard/admin"     replace />
  if (entity.role === 'inspector') return <Navigate to="/dashboard/inspector" replace />
  return <Navigate to="/dashboard/entity" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SelectRolePage />} />
        <Route path="/register/success" element={<RegistrationSuccessPage />} />
        <Route path="/register/:role" element={<RegistrationPage />} />

        {/* Protected — entity roles */}
        <Route path="/dashboard/entity" element={
          <ProtectedRoute allowedRoles={['miner','artisan','aggregator','processing_center','assay','logistics','freight','security']}>
            <EntityDashboard />
          </ProtectedRoute>
        } />

        {/* Protected — inspector only */}
        <Route path="/dashboard/inspector" element={
          <ProtectedRoute allowedRoles={['inspector']}>
            <InspectorDashboard />
          </ProtectedRoute>
        } />

        {/* Protected — admin only */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Generic dashboard — role-aware redirect */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App