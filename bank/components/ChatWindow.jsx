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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-white space-y-2">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No messages yet. Start by selecting an option below.</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))
      )}
      {loading && (
        <div className="flex justify-start">
          <div className="px-4 py-2 bg-gray-200 rounded-lg">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
