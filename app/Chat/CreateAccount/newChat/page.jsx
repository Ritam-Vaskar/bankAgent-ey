"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Axios from "axios";
import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function CreateAccountChatPage({ searchParams }) {
  const { data: session } = useSession();
  const router = useRouter();
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
  // Refs to avoid async state timing issues when submitting right after selection
  const aadhaarFileRef = useRef(null);
  const panFileRef = useRef(null);

  useEffect(() => {
    if (input === undefined || input === null) {
      setInput("");
    }
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    (async () => {
      const res = await Axios.get(`/api/chat/createaccount?chatId=${chatId}`);
      const msgs = Array.isArray(res.data?.messages) ? res.data.messages : [];
      setMessages(msgs);

      let idx = msgs.filter((m) => m.role === "user").length;
      setStepIndex(idx);

      if (msgs.length === 0) {
        askBotQuestion(0);
      }
    })();
  }, [chatId]);

  const saveMessage = async (msg) => {
    try{
    const res = await Axios.post("/api/chat/createaccount", {
      content: msg.content,
      chatId,
      role: msg.role,
      saveMessage: true,
    });
    return res;}
    catch(e)
    {
     if (e.response) {
      // 👈 Backend responded with error
      console.error("Backend error:", e.response.data);
      alert(e.response.data.error);
    } else if (e.request) {
      // 👈 Request sent but no response
      alert("No response from server");
    } else {
      // 👈 Axios setup error
      alert(e.message);
    }
  
   
      }
  
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

  const sendMessage = async () => {
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    if (!currentStep.file) {
      if (!input.trim()) return;

      const userMsg = {
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
   
      const res = await saveMessage(userMsg);
      if(res.length==0) return;
      
      localStorage.setItem(currentStep.key, input.trim());
      setInput("");
    } else {
      const file = fileRef.current?.files?.[0];
      if (!file) return alert("Please upload a file");

      if (stepIndex === 4) {
        setAadhaarFile(file);
        aadhaarFileRef.current = file;
      } else if (stepIndex === 5) {
        setPanFile(file);
        panFileRef.current = file;
      }

      const userMsg = {
        role: "user",
        content: `${file.name} selected successfully ✔`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      await saveMessage(userMsg);
      localStorage.setItem(currentStep.key, file.name);
    }

    const next = stepIndex + 1;
    setStepIndex(next);

    if (next >= steps.length) {
      setSubmitting(true);
      
      try {
        // Use refs first to avoid reading stale state values
        const selectedAadhaarFile = aadhaarFileRef.current || aadhaarFile;
        const selectedPanFile = panFileRef.current || panFile;

        let aadhaarUrl = "";
        let aadhaarNo = "";
        if (selectedAadhaarFile) {
          const aadhaarFormData = new FormData();
          aadhaarFormData.append("file", selectedAadhaarFile);
          const aadhaarRes = await Axios.post("/api/upload/aadhaar", aadhaarFormData);
          aadhaarUrl = aadhaarRes.data.url;
          aadhaarNo = aadhaarRes.data.extractedData?.aadhaarNumber || "";
        }

        let panUrl = "";
        let panNo = "";
        if (selectedPanFile) {
          const panFormData = new FormData();
          panFormData.append("file", selectedPanFile);
          const panRes = await Axios.post("/api/upload/pan", panFormData);
          panUrl = panRes.data.url;
          panNo = panRes.data.extractedData?.panNumber || "";
        }

        if (!panUrl || !panNo) {
          setSubmitting(false);
          alert("PAN upload or extraction failed. Please upload a valid PAN card.");
          // Ask again for PAN upload
          setStepIndex(5);
          await askBotQuestion(5);
          return;
        }

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
        alert("Account Created Successfully!");
        router.push("/Chat/CreateAccount");
      } catch (error) {
        console.error("Account creation error:", error);
        alert("Failed to create account. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    askBotQuestion(next);
  };

  const loadAccountChat = async (selectedChatId) => {
    try {
      const res = await Axios.get(`/api/chat/createaccount?chatId=${selectedChatId}`);
      router.push(`/Chat/CreateAccount/newChat?userId=${userId}&chatId=${selectedChatId}`);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

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
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
        session={session}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeChat={chatId}
          onChatSelect={loadAccountChat}
          onNewChat={createNewAccountChat}
          userId={userId}
        />

        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">Account Creation Assistant</h2>
            <p className="text-sm text-gray-500 mt-1">Secure account setup • Step {stepIndex + 1} of {steps.length}</p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-600" 
                      : "bg-gradient-to-br from-blue-600 to-indigo-600"
                  }`}>
                    {m.role === "user" ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
                  </div>
                  
                  <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-md border ${
                      m.role === "user" 
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500 rounded-br-none" 
                        : "bg-white text-gray-900 border-gray-200 rounded-bl-none"
                    }`}>
                      <p className="text-sm leading-relaxed">{m.content}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1.5">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-3">
              {!steps[stepIndex]?.file ? (
                <div className="flex-1">
                  <input
                    value={input || ""}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <input 
                    type="file" 
                    ref={fileRef} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:font-medium"
                  />
                </div>
              )}

              <button
                onClick={sendMessage}
                disabled={uploading || submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-all shadow-md flex items-center gap-2 font-medium text-white disabled:opacity-50"
              >
                {uploading || submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline text-sm">Processing</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline text-sm">Send</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Overlay */}
          {submitting && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white border-2 border-green-500 rounded-2xl p-10 shadow-2xl max-w-lg mx-4">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Creating Your Account</h3>
                    <p className="text-gray-600 text-sm mb-2">Processing your information securely...</p>
                    <p className="text-gray-500 text-xs">This may take a few moments</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: "0.15s"}}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: "0.3s"}}></div>
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