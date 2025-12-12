"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  Sparkles,
  Trash2,
  MoreVertical
} from "lucide-react";
import axios from "axios";

export default function Sidebar({ isOpen, onClose, activeChat, onChatSelect, onNewChat, userId }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChatId, setLoadingChatId] = useState(null);

  // Fetch chat history on mount and when sidebar opens
  useEffect(() => {
    if (isOpen || !chatHistory.length) {
      fetchChatHistory();
    }
  }, [isOpen, userId]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch both general chat history and create account chats
      const requests = [
        axios.get("/api/chat/history").catch(() => ({ data: { chats: [] } }))
      ];
      
      // Add create account chats if userId is available
      if (userId) {
        requests.push(
          axios.get(`/api/chat/createaccount?userId=${userId}`).catch(() => ({ data: { chatName: [] } }))
        );
      }
      
      const responses = await Promise.all(requests);
      const generalChats = responses[0];
      const accountChats = responses[1];

      const general = generalChats.data.chats || [];
      const accounts = accountChats ? (accountChats.data.chatName || []).map((chat, idx) => ({
        id: chat._id || chat.id || chat.chatId,
        title: `Create Account - Chat ${idx + 1}`,
        status: "completed",
        time: getRelativeTime(chat.createdAt || new Date()),
        type: "account"
      })) : [];

      // Combine and sort by time
      setChatHistory([...general, ...accounts]);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (date) => {
    if (!date) return "Recently";
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;

    try {
      await axios.delete(`/api/chat/${chatId}`);
      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      if (activeChat === chatId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:w-[30%] w-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-700/30 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4 border-b border-slate-800/50">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/20 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold text-sm">New Conversation</span>
            </button>
          </div>

          {/* Chat History Section */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Recent Chats
                </h2>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-slate-700 rounded"></div>
                          <div className="h-4 bg-slate-700 rounded flex-1"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-slate-700 rounded w-16"></div>
                          <div className="h-3 bg-slate-700 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No chat history yet</p>
                ) : (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`w-full group relative overflow-hidden rounded-lg transition-all duration-200 ${
                        activeChat === chat.id
                          ? "bg-blue-900/30 border border-blue-600/50 shadow-lg shadow-blue-500/10"
                          : "bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30"
                      }`}
                    >
                      <div 
                        onClick={() => {
                          console.log("Sidebar: Selecting chat:", chat.id, "Type:", chat.type || "general");
                          setLoadingChatId(chat.id);
                          onChatSelect(chat.id, chat.type || "general");
                          setTimeout(() => setLoadingChatId(null), 1000);
                        }}
                        className="p-3 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {loadingChatId === chat.id ? (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                            ) : (
                              <MessageSquare size={16} className={`flex-shrink-0 ${
                                activeChat === chat.id ? "text-blue-400" : "text-gray-400"
                              }`} />
                            )}
                            <p className={`text-sm font-medium truncate ${
                              activeChat === chat.id ? "text-white" : "text-gray-200"
                            }`}>
                              {chat.title}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{chat.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            chat.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : chat.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {chat.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Quick Actions
                </h2>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = '/Chat/CreateAccount'}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-200">Create Account</span>
                </button>

                <button 
                  onClick={() => window.location.href = '/Chat/LoanService'}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-200">Apply for Loan</span>
                </button>

                <button 
                  onClick={() => window.location.href = '/Chat/Creditcardservice'}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-200">Get Credit Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-blue-400" />
                <p className="text-xs font-semibold text-blue-200">AI-Powered Banking</p>
              </div>
              <p className="text-xs text-gray-400">
                Smart agents helping you with all banking services 24/7
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
