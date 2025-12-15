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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white via-blue-50/30 to-white space-y-3 backdrop-blur-sm">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-[fade-in_0.5s_ease-in]">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium">Welcome! Let's get started</p>
          <p className="text-sm text-gray-400 mt-2">Select an option below to begin your journey</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div key={idx} className="animate-[slide-up_0.3s_ease-out]">
            <MessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          </div>
        ))
      )}
      {loading && (
        <div className="flex justify-start animate-[fade-in_0.3s_ease-in]">
          <div className="px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl shadow-md border border-gray-200">
            <div className="flex space-x-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
