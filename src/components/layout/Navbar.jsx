import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'

export default function Navbar({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const { isAuthenticated, entity, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between
      px-6 md:px-10 ${isDark
        ? 'bg-[#0a1628]/90 backdrop-blur-md border-b border-white/10'
        : 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'
      }`}>

      <Link to="/" className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
              fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <span className={`font-display font-bold text-lg tracking-tight
          ${isDark ? 'text-white' : 'text-primary'}`}>
          TraceChain
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-display font-medium hidden sm:block
              ${isDark ? 'text-white/70' : 'text-textSecondary'}`}>
              {entity?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              className={`text-sm font-display font-semibold transition-colors
                ${isDark ? 'text-white/70 hover:text-white' : 'text-textSecondary hover:text-error'}`}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={`text-sm font-display font-medium transition-colors
              ${isDark ? 'text-white/70 hover:text-white' : 'text-textSecondary hover:text-primary'}`}
          >
            Already registered?{' '}
            <span className={`font-semibold ${isDark ? 'text-accent' : 'text-primary'}`}>
              Log in
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}