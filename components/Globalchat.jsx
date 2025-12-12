"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, Bot, User } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function GlobalChat() {
  const router = useRouter();
  const { data: session } = useSession();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    try {
      const response = await axios.post("/api/chat/create");
      setCurrentChatId(response.data.chatId);
      setMessages([]);
      return response.data.chatId;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  };

  const loadChat = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/${chatId}`);
      const chat = response.data.chat;
      setCurrentChatId(chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const saveMessage = async (message, role) => {
    try {
      let chatId = currentChatId;
      if (!chatId) {
        chatId = await createNewChat();
        if (!chatId) return;
      }
      await axios.post("/api/chat/message", {
        chatId,
        message,
        role,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    await saveMessage(userInput, "user");

    try {
      const res = await axios.post("/api/chat/agent", {
        input: userInput,
        userId: session?.user?.id,
      });

      const data = res.data;

      if (data.message.includes("/api/chat/loan")) {
        router.push("/Chat/LoanService");
      } else if (data.message.includes("/api/chat/account")) {
        router.push("/Chat/CreateAccount");
      } else if (data.message.includes("/api/chat/creditcard")) {
        router.push("/Chat/Creditcardservice");
      } else {
        const botMsg = {
          role: "bot",
          content: data.message || "No service found. We have: Loan Service, Create Account Service, Credit Card Service.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");
      }
    } catch (error) {
      console.error("Error communicating with agent:", error);
      const errorMsg = {
        role: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeChat={currentChatId}
          onChatSelect={loadChat}
          onNewChat={createNewChat}
        />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Bot size={40} className="text-white" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Welcome to AI Banking Assistant
                  </h2>
                  <p className="text-gray-400">
                    I am here to help you with account creation, loan applications, and credit card services. 
                    How can I assist you today?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setInput("I want to create a new account")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">Create Account</button>
                  <button onClick={() => setInput("I need information about loans")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">Loan Services</button>
                  <button onClick={() => setInput("Tell me about credit cards")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">Credit Cards</button>
                </div>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[slide-up_0.3s_ease-out]`}>
                <div className={`max-w-[75%] p-4 rounded-2xl shadow-lg backdrop-blur-lg ${msg.role === "user" ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none" : "bg-slate-800/80 text-gray-100 rounded-bl-none border border-slate-700/50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === "user" ? <User size={16} className="text-blue-100" /> : <Bot size={16} className="text-green-400" />}
                    <span className="text-xs text-gray-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="leading-relaxed text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-[slide-up_0.3s_ease-out]">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
          <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all" />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
