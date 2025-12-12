"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Axios from "axios";
import React from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

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

      const formData = new FormData();
      formData.append("file", file);

      const uploadApi =
        stepIndex === 4 ? "/api/upload/aadhaar" : "/api/upload/pan";
        const Number = stepIndex === 4 ? "aadharNo" : "panNo";
      const uploadRes = await Axios.post(uploadApi, formData);

      const userMsg = {
        role: "user",
        content: `${uploadRes.data.fileName} uploaded successfully ✔`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      await saveMessage(userMsg);

      localStorage.setItem(currentStep.key, uploadRes.data.url);
      if(stepIndex === 5)
      {localStorage.setItem("panNo",uploadRes.data.extractedData.panNumber)}
    else{
      localStorage.setItem("aadharNo",uploadRes.data.extractedData.aadhaarNumber)}
    }

    // NEXT STEP
    const next = stepIndex + 1;
    setStepIndex(next);

    // ---- If all steps done → create account ----
    if (next >= steps.length) {
      const payload = {
        name: localStorage.getItem("name"),
        phone: localStorage.getItem("phone"),
        email: localStorage.getItem("email"),
        address: localStorage.getItem("address"),
        aadharPhotoUrl: localStorage.getItem("aadharUrl"),
        aadharNo : localStorage.getItem("aadharNo"),
        panPhotoUrl: localStorage.getItem("panUrl"),
        panNo : localStorage.getItem("panNo"),
        userId : session?.user?.id,
        chatId : chatId,
        createNewAccount : true

      };

      const res = await Axios.post("/api/chat/createaccount", payload);

      localStorage.clear();
      console.log("Account Number" + res.data.accountNumber)
      alert("Account Created Successfully!");

      router.push("/chat/createaccount");
      return;
    }

    // -------------------------------------------------------
    // 🔥 ASK THE NEXT QUESTION AUTOMATICALLY
    // -------------------------------------------------------
    askBotQuestion(next);
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-xl font-bold text-white">Create Account Chat</h1>

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto mt-4 bg-gray-900 p-3 rounded-lg">
        {messages.map((m, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            {m.role === "user" ? (
              <User className="text-blue-400" />
            ) : (
              <Bot className="text-green-400" />
            )}
            <p className="text-white">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="flex items-center gap-2 mt-4">
        {!steps[stepIndex]?.file ? (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here..."
            className="flex-1 p-2 bg-gray-800 text-white rounded"
          />
        ) : (
          <input type="file" ref={fileRef} className="text-white" />
        )}

        <button
          onClick={sendMessage}
          className="p-2 bg-blue-600 rounded text-white"
        >
          <Send />
        </button>
      </div>
    </div>
  );
}
