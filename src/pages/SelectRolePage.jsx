import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardHat, Pickaxe, PackagePlus, Factory,
  FlaskConical, Truck, Globe, ShieldCheck, CheckCircle2
} from 'lucide-react'
import Navbar from '../components/layout/Navbar.jsx'
import { ENTITY_ROLES } from '../lib/entityConfig.js'

const ICONS = {
  HardHat, Pickaxe, PackagePlus, Factory,
  FlaskConical, Truck, Globe, ShieldCheck,
}

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const navigate = useNavigate()

  const handleContinue = () => {
    if (selectedRole) navigate(`/register/${selectedRole}`)
  }

  return (
    <div className="min-h-screen bg-[#060f1e] relative overflow-hidden">
      {/* Background grid texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,180,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,180,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #004C99 0%, transparent 70%)' }}
      />

      <Navbar variant="dark" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-16 px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeInUp">
          <p className="text-accent text-sm font-display font-semibold tracking-widest uppercase mb-3">
            NordRock TraceChain Network
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
            Entity Registration
          </h1>
          <p className="text-white/50 font-body text-lg max-w-md mx-auto">
            Select your role to begin the registration process and receive your Nexus ID.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl mb-10">
          {ENTITY_ROLES.map((role, i) => {
            const Icon = ICONS[role.icon]
            const isSelected = selectedRole === role.id
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative group rounded-2xl p-5 text-left transition-all duration-200 border
                  ${isSelected
                    ? 'bg-primary border-primary/80 shadow-lg shadow-primary/30 scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-white/80" />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                  ${isSelected ? 'bg-white/20' : 'bg-white/8 group-hover:bg-white/12'}`}>
                  {Icon && <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/60'}`} />}
                </div>
                <p className={`font-display font-semibold text-sm leading-snug
                  ${isSelected ? 'text-white' : 'text-white/70'}`}>
                  {role.label}
                </p>
                <p className={`text-xs mt-1 leading-tight hidden sm:block
                  ${isSelected ? 'text-white/70' : 'text-white/35'}`}>
                  {role.profileType}
                </p>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div className="animate-fadeInUp" style={{ animationDelay: '320ms' }}>
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-12 py-4 rounded-full font-display font-semibold text-base transition-all duration-200
              ${selectedRole
                ? 'bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/40 hover:scale-105 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
          >
            {selectedRole
              ? `Continue with ${ENTITY_ROLES.find(r => r.id === selectedRole)?.label}`
              : 'Select a role to continue'
            }
          </button>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex gap-6 text-xs text-white/25 font-body">
          <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
          <a href="#" className="hover:text-white/50 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white/50 transition-colors">Contact Support</a>
        </div>
      </div>
    </div>
  )
}
