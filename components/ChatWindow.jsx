"use client"

import { useEffect, useRef } from "react"
import MessageBubble from "./MessageBubble"

export default function ChatWindow({ messages, loading }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 space-y-5">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4">
          {/* Decorative top element */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-100/40 to-transparent pointer-events-none"></div>
          
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-24 h-24 bg-slate-200/30 rounded-full blur-xl"></div>
            
            {/* Main icon container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-white to-slate-50 rounded-full flex items-center justify-center mb-8 shadow-lg border border-slate-200/60">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-white rounded-full flex items-center justify-center">
                <svg className="w-11 h-11 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-slate-800 mb-3 tracking-tight">Welcome to Support</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed mb-6">
            Our secure virtual assistant is ready to help you with account inquiries, transactions, and banking services
          </p>
          
          {/* Feature badges */}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-200/60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-medium text-slate-600">Secure</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-200/60">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-slate-600">24/7 Available</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className="animate-[fadeIn_0.4s_ease-out] opacity-0"
              style={{ 
                animation: 'fadeIn 0.4s ease-out forwards',
                animationDelay: `${Math.min(idx * 0.05, 0.3)}s` 
              }}
            >
              <MessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} />
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="flex justify-start animate-[fadeIn_0.3s_ease-in]">
          <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200/60 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
              </div>
              <span className="text-xs text-slate-500 font-medium">Processing</span>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}