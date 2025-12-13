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
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
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

  const loadChat = async (chatId, chatType = "general") => {
    try {
      setLoading(true);
      console.log("Loading chat:", chatId, "Type:", chatType);

      let response;
      let formattedMessages = [];

      if (chatType === "account") {
        response = await axios.post("/api/chat/createaccount", {
          getchat: true,
          chatId: chatId
        });
        console.log("Account chat response:", response.data);

        formattedMessages = (response.data.messages || []).map(msg => ({
          role: msg.sender || msg.role,
          content: msg.message || msg.content,
          timestamp: msg.createdAt || msg.timestamp || new Date(),
        }));
      } else {
        response = await axios.get(`/api/chat/${chatId}`);
        const chat = response.data.chat;
        console.log("General chat loaded:", chat);

        formattedMessages = (chat.messages || []).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || new Date(),
        }));
      }

      setCurrentChatId(chatId);
      setMessages(formattedMessages);
      console.log("Messages set:", formattedMessages.length, "messages");
    } catch (error) {
      console.error("Error loading chat:", error);
      alert("Failed to load chat. Please try again.");
    } finally {
      setLoading(false);
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
      const response = data.message;

      if (response.includes("ACCOUNT_EXISTS")) {
        const botMsg = {
          role: "bot",
          content: "You already have an account with us! Your account is active and ready to use. Would you like to apply for a loan or credit card instead?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");
      }
      else if (response.includes("NEED_ACCOUNT_FIRST")) {
        const service = response.split("|")[1];
        const serviceName = service === "loan" ? "loan" : "credit card";
        const botMsg = {
          role: "bot",
          content: `To apply for a ${serviceName}, you need to create a bank account first. Would you like me to help you create an account now?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");
      }
      else if (response.startsWith("CHAT|")) {
        const chatResponse = response.replace("CHAT|", "");
        const botMsg = {
          role: "bot",
          content: chatResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");
      }
      else if (response.includes("/api/chat/loan")) {
        const botMsg = {
          role: "bot",
          content: "Great! Let me redirect you to our Loan Service. You can explore various loan options there.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");

        setRedirecting(true);
        setRedirectMessage("Redirecting to Loan Service...");
        setTimeout(() => router.push("/Chat/LoanService"), 1000);
      }
      else if (response.includes("/api/chat/account")) {
        const botMsg = {
          role: "bot",
          content: "Perfect! Let's create your bank account. I'll guide you through the process step by step.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");

        setRedirecting(true);
        setRedirectMessage("Preparing account creation...");
        setTimeout(async () => {
          const accountRes = await axios.post("/api/chat/createaccount", {
            userId: session?.user?.id,
            newchat: true,
          });
          router.push(`/Chat/CreateAccount/newChat?userId=${session?.user?.id}&chatId=${accountRes.data.chatId}`);
        }, 1000);
      }
      else if (response.includes("/api/chat/creditcard")) {
        const botMsg = {
          role: "bot",
          content: "Excellent! Redirecting you to our Credit Card Service where you can explore premium card options.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");

        setRedirecting(true);
        setRedirectMessage("Redirecting to Credit Card Service...");
        setTimeout(() => router.push("/Chat/Creditcardservice"), 1000);
      }
      else {
        const botMsg = {
          role: "bot",
          content: response || "I can help you with Account Creation, Loan Applications, and Credit Card Services. What would you like to do today?",
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

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
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
          userId={session?.user?.id}
        />

        <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {/* Chat Header - Fixed */}
          <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">AI Banking Assistant</h2>
            <p className="text-sm text-gray-500">Secure & Intelligent Banking Support</p>
          </div>

          {/* Chat Messages - Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={32} className="text-white" />
                </div>
                <div className="text-center max-w-2xl">
                  <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                    Welcome to Secure Banking
                  </h2>
                  <p className="text-gray-600 text-base mb-6">
                    Your intelligent AI assistant for all banking needs. I can help you with:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-blue-600 font-semibold mb-1">🏦 Account Creation</p>
                      <p className="text-gray-600 text-sm">Open a new bank account</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-green-600 font-semibold mb-1">💰 Loan Services</p>
                      <p className="text-gray-600 text-sm">Apply for personal loans</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-purple-600 font-semibold mb-1">💳 Credit Cards</p>
                      <p className="text-gray-600 text-sm">Get premium credit cards</p>
                    </div>
                  </div>

                  {/* Encryption message - only on welcome screen */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                    </svg>
                    <span>End-to-end encrypted • Secure Banking Platform</span>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setInput("I want to open a new account")}
                      className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center shadow-md hover:scale-105"
                    >
                      Open New Account
                    </button>
                    <button
                      onClick={() => setInput("I need a loan")}
                      className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply for Loan
                    </button>
                    <button
                      onClick={() => setInput("I want a credit card")}
                      className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Get Credit Card
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && messages.map((msg, index) => (
              <div key={`msg-${index}-${msg.timestamp}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                <div className={`flex gap-3 max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${msg.role === "user"
                    ? "bg-blue-600"
                    : "bg-gray-200"
                    }`}>
                    {msg.role === "user" ? <User size={18} className="text-white" /> : <Bot size={18} className="text-gray-700" />}
                  </div>

                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-lg ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 border border-gray-200"
                      }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Animation */}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-200">
                    <Bot size={18} className="text-gray-700" />
                  </div>
                  <div className="px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>

          {/* Redirecting Overlay */}
          {redirecting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-2xl max-w-md mx-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{redirectMessage}</h3>
                    <p className="text-gray-500 text-sm">Please wait...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area - Fixed at Bottom */}
          <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message... (Press Enter to send)"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm resize-none transition-all"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-all disabled:cursor-not-allowed shadow-sm flex items-center gap-2 font-medium text-sm text-white"
              >
                <Send size={18} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}