"use client"

import { useState } from "react"

export default function MenuButtons({ onSelectOption, disabled }) {
  const [activeCard, setActiveCard] = useState(null)

  const options = [
    {
      id: "account",
      title: "Create Account",
      description: "Open a new bank account in minutes",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      enabled: true,
    },
    {
      id: "loan",
      title: "Apply for Loan",
      description: "Quick loan approval with AI assistance",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      enabled: false,
    },
    {
      id: "credit",
      title: "Credit Card",
      description: "Get instant credit card approval",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      enabled: false,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 bg-white shadow-lg rounded-lg border border-slate-200 max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Banking Services</h2>
          <p className="text-sm text-slate-600">Select a service to begin your application</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => {
                if (option.enabled) {
                  setActiveCard(option.id)
                  onSelectOption(option.id)
                }
              }}
              disabled={disabled || !option.enabled}
              className={`group relative overflow-hidden rounded-lg p-6 transition-all duration-300 text-left border ${
                option.enabled
                  ? activeCard === option.id
                    ? "bg-blue-50 border-blue-400 shadow-lg"
                    : "bg-white hover:bg-slate-50 border-slate-300 hover:border-blue-400 shadow hover:shadow-lg"
                  : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-70"
              } disabled:opacity-40 disabled:cursor-not-allowed ${
                index === 0 ? "ml-0" : index === options.length - 1 ? "mr-0" : ""
              }`}
            >
              {/* Icon */}
              <div className="relative z-10 mb-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg ${
                  option.enabled ? "bg-blue-50" : "bg-slate-100"
                } ${option.enabled ? "text-blue-600" : "text-slate-400"} transition-all duration-300 ${
                  option.enabled ? "group-hover:bg-blue-100 group-hover:scale-105" : ""
                }`}>
                  {option.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="mb-2">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    option.enabled ? "text-slate-900" : "text-slate-500"
                  }`}>
                    {option.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    option.enabled ? "text-slate-600" : "text-slate-400"
                  }`}>
                    {option.description}
                  </p>
                </div>
                
                {!option.enabled && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-amber-700">Coming Soon</span>
                  </div>
                )}
                
                {option.enabled && (
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Begin Application</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Hover effect overlay */}
              {option.enabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/20 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm">
              Need assistance? Contact our support team at <span className="font-semibold text-blue-600">1-800-BANK-HELP</span> or visit a branch near you
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}