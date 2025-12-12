"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Axios from "axios";
import React from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function CreateAccountChatPage({ searchParams }) {
  const { data: session } = useSession();
  const router = useRouter();

  // ✔ unwrap searchParams
  const { chatId } = React.use(searchParams);

  const userId = session?.user?.id;

  const steps = [
    { key: "name", prompt: "Please enter your name:", file: false },
    { key: "phone", prompt: "Enter your phone number:", file: false },
    { key: "email", prompt: "Enter your email:", file: false },
    { key: "address", prompt: "Enter your address:", file: false },
    { key: "aadharUrl", prompt: "Please upload your Aadhaar card:", file: true },
    { key: "panUrl", prompt: "Please upload your PAN card:", file: true },
  ];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  // Ensure input is always a string
  useEffect(() => {
    if (input === undefined || input === null) {
      setInput("");
    }
  }, [input]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat from backend
  useEffect(() => {
    if (!chatId) return;

    (async () => {
      const res = await Axios.get(`/api/chat/createaccount?chatId=${chatId}`);

      const msgs = Array.isArray(res.data?.messages) ? res.data.messages : [];

      setMessages(msgs);

      // restore step index
      let idx = msgs.filter((m) => m.role === "user").length;
      setStepIndex(idx);

      // 👇 If starting new chat, immediately ask first question
      if (msgs.length === 0) {
        askBotQuestion(0);
      }
    })();
  }, [chatId]);

  // Save to DB
  const saveMessage = async (msg) => {
    await Axios.post("/api/chat/createaccount", {
      content: msg.content,
      chatId,
      role: msg.role,
      saveMessage: true,
    });
  };

  // -------------------------------------------------------
  // 🟢 Function to ask the bot question automatically
  // -------------------------------------------------------
  const askBotQuestion = async (index) => {
    if (!steps[index]) return;

    const botMsg = {
      role: "bot",
      content: steps[index].prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMsg]);
    await saveMessage(botMsg);
  };

  // -------------------------------------------------------
  // 🟡 Send message handler
  // -------------------------------------------------------
  const sendMessage = async () => {
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    // ---- USER TEXT STEP ----
    if (!currentStep.file) {
      if (!input.trim()) return;

      const userMsg = {
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      await saveMessage(userMsg);

      localStorage.setItem(currentStep.key, input.trim());
      setInput("");
    }

    // ---- USER FILE STEP ----
    else {
      const file = fileRef.current?.files?.[0];
      if (!file) return alert("Please upload a file");

      // Store file in state instead of uploading immediately
      if (stepIndex === 4) {
        setAadhaarFile(file);
      } else if (stepIndex === 5) {
        setPanFile(file);
      }

      // Show success message
      const userMsg = {
        role: "user",
        content: `${file.name} selected successfully ✔`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      await saveMessage(userMsg);

      // Store filename temporarily
      localStorage.setItem(currentStep.key, file.name);
    }

    // NEXT STEP
    const next = stepIndex + 1;
    setStepIndex(next);

    // ---- If all steps done → create account ----
    if (next >= steps.length) {
      setSubmitting(true);
      
      try {
        // Upload Aadhaar file
        let aadhaarUrl = "";
        let aadhaarNo = "";
        if (aadhaarFile) {
          const aadhaarFormData = new FormData();
          aadhaarFormData.append("file", aadhaarFile);
          
          const aadhaarRes = await Axios.post("/api/upload/aadhaar", aadhaarFormData);
          aadhaarUrl = aadhaarRes.data.url;
          aadhaarNo = aadhaarRes.data.extractedData?.aadhaarNumber || "";
        }

        // Upload PAN file
        let panUrl = "";
        let panNo = "";
        if (panFile) {
          const panFormData = new FormData();
          panFormData.append("file", panFile);
          
          const panRes = await Axios.post("/api/upload/pan", panFormData);
          panUrl = panRes.data.url;
          panNo = panRes.data.extractedData?.panNumber || "";
        }

        // Create account with uploaded URLs
        const payload = {
          name: localStorage.getItem("name"),
          phone: localStorage.getItem("phone"),
          email: localStorage.getItem("email"),
          address: localStorage.getItem("address"),
          aadharPhotoUrl: aadhaarUrl,
          aadharNo: aadhaarNo,
          panPhotoUrl: panUrl,
          panNo: panNo,
          userId: session?.user?.id,
          chatId: chatId,
          createNewAccount: true
        };

        const res = await Axios.post("/api/chat/createaccount", payload);

        localStorage.clear();
        console.log("Account Number: " + res.data.accountNumber);
        alert("Account Created Successfully!");

        router.push("/Chat/CreateAccount");
      } catch (error) {
        console.error("Account creation error:", error);
        alert("Failed to create account. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    // -------------------------------------------------------
    // 🔥 ASK THE NEXT QUESTION AUTOMATICALLY
    // -------------------------------------------------------
    askBotQuestion(next);
  };

  // Load chat from sidebar
  const loadAccountChat = async (selectedChatId) => {
    try {
      const res = await Axios.get(`/api/chat/createaccount?chatId=${selectedChatId}`);
      const messages = res.data.Allmessages || [];
      
      // Redirect to the selected chat
      router.push(`/Chat/CreateAccount/newChat?userId=${userId}&chatId=${selectedChatId}`);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  // Create new chat
  const createNewAccountChat = async () => {
    try {
      const response = await Axios.post("/api/chat/createaccount", {
        userId: userId,
        newchat: true,
      });
      router.push(`/Chat/CreateAccount/newChat?userId=${userId}&chatId=${response.data.chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navbar */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeChat={chatId}
          onChatSelect={loadAccountChat}
          onNewChat={createNewAccountChat}
          userId={userId}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col lg:w-[70%] bg-slate-900/50">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-200">Account Creation Assistant</h2>
            <p className="text-xs text-slate-400 mt-1">Secure account setup • Step {stepIndex + 1} of {steps.length}</p>
          </div>

          {/* CHAT WINDOW - Fixed Height with Scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-[fade-in_0.3s_ease-in]`}>
                <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700" 
                      : "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50"
                  }`}>
                    {m.role === "user" ? <User size={18} className="text-white" /> : <Bot size={18} className="text-blue-400" />}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                      m.role === "user" 
                        ? "bg-gradient-to-br from-blue-700 to-indigo-700 text-white rounded-br-sm" 
                        : "bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/50"
                    }`}>
                      <p className="text-[15px] leading-relaxed">{m.content}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1.5 px-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>

          {/* INPUT AREA - Fixed at Bottom */}
          <div className="px-6 py-4 border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-end gap-3">
              {!steps[stepIndex]?.file ? (
                <div className="flex-1">
                  <input
                    value={input || ""}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response... (Press Enter to send)"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 text-white placeholder-slate-500 text-[15px] transition-all"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <input 
                    type="file" 
                    ref={fileRef} 
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-700 file:text-white hover:file:bg-blue-600 file:font-medium transition-all"
                  />
                </div>
              )}

              <button
                onClick={sendMessage}
                disabled={uploading || submitting}
                className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Creating...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              🔒 Secure document upload • All data is encrypted
            </p>
          </div>

          {/* Full Screen Loading Overlay for Account Creation */}
          {submitting && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-slate-800/90 border border-green-500/30 rounded-2xl p-10 shadow-2xl max-w-lg mx-4">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">Creating Your Account</h3>
                    <p className="text-slate-300 text-sm mb-2">Processing your information securely...</p>
                    <p className="text-slate-400 text-xs">This may take a few moments</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: "0.15s"}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: "0.3s"}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
