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
        // Load account creation chat
        response = await axios.post("/api/chat/createaccount", {
          getchat: true,
          chatId: chatId
        });
        console.log("Account chat response:", response.data);
        
        // Account creation chats have messages in response.data.messages
        formattedMessages = (response.data.messages || []).map(msg => ({
          role: msg.sender || msg.role,
          content: msg.message || msg.content,
          timestamp: msg.createdAt || msg.timestamp || new Date(),
        }));
      } else {
        // Load general chat
        response = await axios.get(`/api/chat/${chatId}`);
        const chat = response.data.chat;
        console.log("General chat loaded:", chat);
        
        // General chats have messages in chat.messages
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

      // Handle ACCOUNT_EXISTS case
      if (response.includes("ACCOUNT_EXISTS")) {
        const botMsg = {
          role: "bot",
          content: "You already have an account with us! Your account is active and ready to use. Would you like to apply for a loan or credit card instead?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessage(botMsg.content, "bot");
      }
      // Handle NEED_ACCOUNT_FIRST case
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
      // Handle CHAT response (general conversation)
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
      // Handle Loan Service redirect
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
      // Handle Create Account redirect
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
      // Handle Credit Card Service redirect
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
      // Fallback for any other response
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
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
        <div className="flex-1 flex flex-col lg:w-[70%] bg-slate-900/50">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-200">AI Banking Assistant</h2>
            <p className="text-xs text-slate-400 mt-1">Secure & Intelligent Banking Support</p>
          </div>

          {/* Chat Messages - Fixed Height with Scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <Bot size={36} className="text-white" />
                </div>
                <div className="text-center max-w-lg">
                  <h2 className="text-2xl font-bold mb-3 text-slate-100">
                    Welcome to Secure Banking
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Your intelligent AI assistant for all banking needs. I can help you with:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-blue-400 font-semibold text-sm mb-1">🏦 Account Creation</p>
                      <p className="text-slate-400 text-xs">Open a new bank account</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-green-400 font-semibold text-sm mb-1">💰 Loan Services</p>
                      <p className="text-slate-400 text-xs">Apply for personal loans</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-purple-400 font-semibold text-sm mb-1">💳 Credit Cards</p>
                      <p className="text-slate-400 text-xs">Get premium credit cards</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-4">
                    💬 Just tell me what you'd like to do, and I'll guide you!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button 
                    onClick={() => setInput("I want to open a new account")}
                    className="px-5 py-2.5 bg-blue-700/80 hover:bg-blue-600 rounded-lg text-sm font-medium transition-all border border-blue-600/30 shadow-lg hover:shadow-blue-500/20"
                  >
                    Open New Account
                  </button>
                  <button 
                    onClick={() => setInput("I need a loan")}
                    className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-sm font-medium transition-all border border-slate-700/50"
                  >
                    Apply for Loan
                  </button>
                  <button 
                    onClick={() => setInput("I want a credit card")}
                    className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-sm font-medium transition-all border border-slate-700/50"
                  >
                    Get Credit Card
                  </button>
                </div>
              </div>
            )}
            
            {/* Messages */}
            {messages.length > 0 && messages.map((msg, index) => (
              <div key={`msg-${index}-${msg.timestamp}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[fade-in_0.3s_ease-in]`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700" 
                      : "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50"
                  }`}>
                    {msg.role === "user" ? <User size={18} className="text-white" /> : <Bot size={18} className="text-blue-400" />}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                      msg.role === "user" 
                        ? "bg-gradient-to-br from-blue-700 to-indigo-700 text-white rounded-br-sm" 
                        : "bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/50"
                    }`}>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1.5 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Animation */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 shadow-lg">
                    <Bot size={18} className="text-blue-400" />
                  </div>
                  <div className="px-4 py-3 bg-slate-800/90 rounded-2xl rounded-bl-sm border border-slate-700/50 shadow-lg">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.15s"}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.3s"}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>

          {/* Redirecting Overlay */}
          {redirecting && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800/90 border border-blue-500/30 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">{redirectMessage}</h3>
                    <p className="text-slate-400 text-sm">Please wait...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area - Fixed at Bottom */}
          <div className="px-6 py-4 border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-sm">
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
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 text-white placeholder-slate-500 text-[15px] resize-none transition-all"
                  style={{minHeight: '48px', maxHeight: '120px'}}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 font-medium text-sm"
              >
                <Send size={18} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              🔒 End-to-end encrypted • Secure Banking Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
