"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User } from "lucide-react";
import Axios from "axios";
/**
 * Read-Only Chat Preview Component
 * - Shows the entire saved chat history from localStorage
 * - Allows scrolling
 * - User cannot type, upload, or modify anything
 */
export default function ChatPreview({chat_id}) {
  const [messages, setMessages] = useState([]);
  const chatBoxRef = useRef(null);

  useEffect(async() => {
    const Message = await Axios.get('/api/chat/createaccount',chat_id);
    setMessages(Message.data);
  }, []);

 

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="p-4 bg-purple-600 text-white text-xl font-bold shadow-md">
        Chat Preview (Read Only)
      </header>

      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 border-t"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-500">No chat history available.</p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs p-3 rounded-2xl shadow-md text-sm ${
                m.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-gray-900 rounded-bl-none"
              }`}
            >
              <div className="flex items-start gap-2">
                {m.sender === "bot" ? <Bot size={16} /> : <User size={16} />}
                <span>{m.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="p-3 bg-white text-center text-gray-500 border-t">
        🔒 This preview is read‑only. New messages cannot be sent.
      </footer>
    </div>
  );
}
