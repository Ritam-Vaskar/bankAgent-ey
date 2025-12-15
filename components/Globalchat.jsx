"use client";

import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, Bot, User } from "lucide-react";

export default function GlobalChat() {
  const router = useRouter();
  const { data: session } = useSession();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await Axios.post("/api/chat/agent", {
        input: input,
        userId: session?.user?.id,
      });

      const data = res.data;

      // Routing based on bot response
      if (data.message.includes("/api/chat/loan")) {
        router.push("/Chat/LoanService");
      } else if (data.message.includes("/api/chat/account")) {
        router.push("/Chat/CreateAccount");
      } else if (data.message.includes("/api/chat/creditcard")) {
        router.push("/Chat/Creditcardservice");
      } else {
        const botMsg = {
          role: "bot",
          content:
            "No service found. We have: Loan Service, Create Account Service, Credit Card Service.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (error) {
      console.error("Error communicating with agent:", error);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* HEADER */}
      <div className="p-4 bg-gray-800/60 backdrop-blur-md border-b border-gray-700 flex items-center gap-3 sticky top-0 z-10">
        <Bot className="text-blue-400" />
        <h1 className="text-xl font-semibold">AI Assistant</h1>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <p className="text-center text-gray-400 text-sm">
          I am your virtual agent. Tell me which service you want.
        </p>

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-2xl shadow-md backdrop-blur-lg
              ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-200 rounded-bl-none"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} className="text-green-400" />
                )}
                <span className="text-xs text-gray-300">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* LOADING ANIMATION */}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 bg-gray-800 rounded-2xl w-fit">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="p-4 bg-gray-800/60 backdrop-blur-md border-t border-gray-700 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="p-3 bg-blue-600 hover:bg-blue-700 transition rounded-xl disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
