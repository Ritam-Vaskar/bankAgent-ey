"use client"

export default function MenuButtons({ onSelectOption, disabled }) {
  const options = [
    {
      id: "account",
      title: "Create Account",
      description: "Open a new bank account in minutes",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      gradient: "from-blue-500 to-indigo-600",
      enabled: true,
    },
    {
      id: "loan",
      title: "Apply for Loan",
      description: "Quick loan approval with AI assistance",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-600",
      enabled: false,
    },
    {
      id: "credit",
      title: "Credit Card",
      description: "Get instant credit card approval",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-600",
      enabled: false,
    },
  ]

  return (
    <div className="p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-200 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
          </svg>
          Choose a Service
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => option.enabled && onSelectOption(option.id)}
              disabled={disabled || !option.enabled}
              className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                option.enabled
                  ? "bg-gradient-to-br " + option.gradient + " text-white hover:scale-105 hover:shadow-2xl cursor-pointer"
                  : "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed opacity-60"
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`mb-4 inline-block p-3 rounded-xl ${
                  option.enabled ? "bg-white/20" : "bg-black/10"
                } backdrop-blur-sm`}>
                  {option.icon}
                </div>
                <h4 className="text-lg font-bold mb-2">{option.title}</h4>
                <p className={`text-sm ${
                  option.enabled ? "text-white/90" : "text-gray-500"
                }`}>
                  {option.description}
                </p>
                {!option.enabled && (
                  <div className="mt-3 inline-block px-3 py-1 bg-black/20 rounded-full text-xs font-semibold">
                    Coming Soon
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
