import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar variant="light" />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <div className="card w-full max-w-lg text-center">
          <h1 className="text-2xl font-display font-bold text-textPrimary mb-2">HQ Dashboard</h1>
          <p className="text-textSecondary mb-6">
            The full NordRock HQ Dashboard (Step 7) will be built here after the registration module is complete.
          </p>
          <Link to="/register" className="btn-primary inline-block">← Go to Registration</Link>
        </div>
      </div>
    </div>
  )
}
