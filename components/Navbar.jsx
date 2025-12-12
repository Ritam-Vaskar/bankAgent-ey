"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  User, 
  LogOut, 
  CreditCard, 
  DollarSign, 
  UserPlus, 
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const services = [
    { name: "Create Account", icon: UserPlus, color: "text-blue-400" },
    { name: "Loan Service", icon: DollarSign, color: "text-green-400" },
    { name: "Credit Card", icon: CreditCard, color: "text-purple-400" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 border-b border-slate-700/50 backdrop-blur-xl shadow-2xl">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Agentic Banking AI</h1>
                <p className="text-xs text-blue-200">Next-Gen Digital Banking</p>
              </div>
            </div>
          </div>

          {/* Center Section - Services */}
          <div className="hidden md:flex items-center gap-2">
            {services.map((service, idx) => (
              <button
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
              >
                <service.icon size={18} className={service.color} />
                <span className="text-sm text-gray-200 group-hover:text-white">
                  {service.name}
                </span>
              </button>
            ))}
          </div>

          {/* Right Section - User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition-all duration-300"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-300">
                  {session?.user?.email}
                </p>
              </div>
              <ChevronDown 
                size={18} 
                className={`text-gray-300 transition-transform duration-300 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-[slide-up_0.2s_ease-out]">
                <div className="p-4 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-b border-slate-700">
                  <p className="font-semibold text-white">{session?.user?.name}</p>
                  <p className="text-xs text-gray-300">{session?.user?.email}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {/* Profile action */}}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <User size={18} className="text-blue-400" />
                    <span className="text-sm text-gray-200">My Profile</span>
                  </button>
                  
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={18} className="text-red-400" />
                    <span className="text-sm text-gray-200">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
