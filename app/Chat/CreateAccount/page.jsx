"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CreateAccountChatPage() {
  const { data: session } = useSession();

  const FORM_KEY = "create_account_form";
  const steps = [
    { key: "name", prompt: "Please enter your name:" },
    { key: "phone", prompt: "Enter your phone number:" },
    { key: "email", prompt: "Enter your email:" },
    { key: "address", prompt: "Enter your address:" },
    { key: "aadharUrl", prompt: "Please upload your Aadhaar:", isFile: true },
    { key: "panUrl", prompt: "Please upload your PAN card:", isFile: true }
  ];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const fileRef = useRef(null);

  // Load initial messages and form progress
  useEffect(() => {
    const form = JSON.parse(localStorage.getItem(FORM_KEY)) || { progressIndex: 0 };
    const initialPrompt = steps[form.progressIndex]?.prompt || "Let's continue!";
    const savedMessages = JSON.parse(localStorage.getItem("chat_messages")) || [
      { id: "bot-start", sender: "bot", text: initialPrompt }
    ];
    setMessages(savedMessages);
  }, []);

  // Auto-scroll and save chat messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  // Get current form from localStorage
  function getForm() {
    return JSON.parse(localStorage.getItem(FORM_KEY)) || { progressIndex: 0 };
  }

  // Save updated form to localStorage
  function saveForm(form) {
    localStorage.setItem(FORM_KEY, JSON.stringify(form));
  }

  // Simulate file upload
  async function uploadFile(file) {
    // Dummy URL for now
    const url = "https://example.com/uploads/" + file.name;
    return url;
  }

  // Finish form and submit
  async function finishAndSubmit() {
    const form = getForm();
    console.log("Submitting form:", form);
    const chatMesages = localStorage.getItem("chat_messages");
    console.log("Chat messages:", chatMesages);

    try {
      // Example: await axios.post("/api/account/create-final", { ...form, userId: session?.user?.id });

      setMessages(prev => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: "bot", text: "🎉 Account successfully created!" }
      ]);

      localStorage.removeItem(FORM_KEY);
      localStorage.removeItem("chat_messages");
    } catch (err) {
      console.error("Submit error:", err);
      setMessages(prev => [
        ...prev,
        { id: `bot-err-${Date.now()}`, sender: "bot", text: "⚠️ Server error!" }
      ]);
    }
  }

  // Handle sending messages
  async function sendMessage({ message = "", file = null }) {
    let form = getForm();
    const step = steps[form.progressIndex];

    // Insert user's message bubble
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: file ? `📎 ${file.name} Submitted` : message }
    ]);

    if (step.isFile) {
      if (!file) {
        // Bot asks again for file
        return setMessages(prev => [
          ...prev,
          { id: `bot-${Date.now()}`, sender: "bot", text: step.prompt }
        ]);
      }
      try {
        const url = await uploadFile(file);
        form[step.key] = url;
      } catch (err) {
        console.error("File upload error:", err);
        return setMessages(prev => [
          ...prev,
          { id: `bot-err-${Date.now()}`, sender: "bot", text: "⚠️ File upload failed. Please try again." }
        ]);
      }
    } else {
      form[step.key] = message;
    }

    form.progressIndex++;
    saveForm(form);

    if (form.progressIndex < steps.length) {
      setMessages(prev => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: "bot", text: steps[form.progressIndex].prompt }
      ]);
    } else {
      await finishAndSubmit();
    }

    setInput("");
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="p-4 bg-blue-600 text-white text-xl font-bold shadow">
        Create Account
      </header>

      <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
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

      <div className="p-4 bg-white border-t flex items-center gap-3">
        <button
          onClick={() => fileRef.current.click()}
          className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={e => {
            const f = e.target.files[0];
            if (f) sendMessage({ file: f });
            e.target.value = null;
          }}
        />

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          disabled={!input.trim()}
          onClick={() => sendMessage({ message: input })}
          className={`p-3 rounded-full text-white ${
            input.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
