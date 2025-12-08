"use client"

import { useState } from "react"

export default function InputField({ onSubmit, loading, placeholder = "Type your response..." }) {
  const [input, setInput] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      onSubmit(input)
      setInput("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gradient-to-r from-white via-blue-50/30 to-white border-t-2 border-blue-100 shadow-2xl backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={placeholder}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-lg group-hover:border-blue-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
