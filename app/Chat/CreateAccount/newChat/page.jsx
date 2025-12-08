"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Axios from "axios";

export default function CreateAccountChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || null;

  const FORM_KEY = "create_account_form";
  const CHAT_ID_KEY = "current_chat_id";
  const MESSAGES_KEY = "chat_messages";
  const ACCOUNT_KEY = "created_account_number";

  const steps = [
    { key: "name", prompt: "Please enter your name:" },
    { key: "phone", prompt: "Enter your phone number:" },
    { key: "email", prompt: "Enter your email:" },
    { key: "address", prompt: "Enter your address:" },
    { key: "aadharUrl", prompt: "Please upload your Aadhaar:", isFile: true },
    { key: "panUrl", prompt: "Please upload your PAN card:", isFile: true }
  ];

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isReadonly, setIsReadonly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const chatBoxRef = useRef(null);
  const fileRef = useRef(null);

  // Helper: get/save form in localStorage
  function getForm() {
    return JSON.parse(localStorage.getItem(FORM_KEY)) || { progressIndex: 0 };
  }
  function saveForm(form) {
    localStorage.setItem(FORM_KEY, JSON.stringify(form));
  }

  // Helper: persist messages locally
  function persistMessages(ms) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(ms));
  }

  // Create or resume chat id on mount
  useEffect(() => {
    async function ensureChat() {
      const savedChatId = localStorage.getItem(CHAT_ID_KEY);
      if (savedChatId) {
        setChatId(savedChatId);
        return;
      }
      try {
        const resp = await Axios.post("/api/chat/createaccount", {
          newchat: true,
          userId
        });
        const newId = resp.data?.chatId || resp.data?.id || null;
        if (newId) {
          localStorage.setItem(CHAT_ID_KEY, newId);
          setChatId(newId);
        }
      } catch (err) {
        console.error("Create chat error:", err);
      }
    }
    ensureChat();
  }, [userId]);

  // Load initial messages and form progress
  useEffect(() => {
    const form = getForm();
    const initialPrompt = steps[form.progressIndex]?.prompt || "Let's continue!";
    const savedMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [
      { id: "bot-start", sender: "bot", text: initialPrompt, timestamp: Date.now() }
    ];
    setMessages(savedMessages);

    // If there's no chat in DB yet, ensure we post the initial bot message once DB chat exists.
    // We'll rely on later sendMessage/ensureMessagePersistToServer calls.
  }, []);

  // Auto-scroll + persist to localStorage
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
    persistMessages(messages);
  }, [messages]);

  // Utility: append local message and POST to server
  async function pushMessageToStateAndServer({ content, role }) {
    const msg = {
      id: `${role}-${Date.now()}`,
      sender: role === "user" ? "user" : "bot",
      text: content,
      timestamp: Date.now()
    };

    // Add locally first
    setMessages(prev => {
      const next = [...prev, msg];
      persistMessages(next);
      return next;
    });

    // Attempt to save to server (best-effort; don't block UI)
    try {
      if (!chatId) {
        // wait one second for chatId creation (in case still creating)
        await new Promise(res => setTimeout(res, 1000));
      }
      if (!chatId) return; // can't send
     const res =  await Axios.post(`/api/chat/createaccount`, {
        content,
        role,
        timestamp: msg.timestamp,
        chatId,
        userId
      });
      console.log(res.data);
    } catch (err) {
      console.warn("Failed to push message to server:", err);
      // optionally mark message as unsent in local state (not implemented)
    }
  }

  // Upload file to appropriate endpoint and return URL
  async function uploadFileToServer(file, stepKey) {
    const fd = new FormData();
    fd.append("file", file);
    // choose endpoint by stepKey
    const endpoint = stepKey === "aadharUrl" ? "/api/upload/aadhar" : "/api/upload/pan";
    const res = await Axios.post(endpoint, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    // Expecting JSON like { url: 'https://...' }
    return res.data?.url;
  }

  // Finish/submit final form to backend and get account number
  async function finishAndSubmitToServer() {
    const form = getForm();
    if (!chatId) {
      console.error("No chatId for final submission");
      return;
    }
    setSubmitting(true);
    try {
      // Send final form to backend for account creation.
      // Endpoint returns { accountNumber }
      const resp = await Axios.post(`/api/chats/${chatId}/complete`, {
        form,
        userId,
        chatId
      });
      const accountNumber = resp.data?.accountNumber || resp.data?.account || null;

      if (accountNumber) {
        localStorage.setItem(ACCOUNT_KEY, accountNumber);
        // Save a final bot message with the account number
        await pushMessageToStateAndServer({
          content: `🎉 Account created successfully. Account Number: ${accountNumber}`,
          role: "bot"
        });
      } else {
        await pushMessageToStateAndServer({
          content: "⚠️ Account creation returned no account number.",
          role: "bot"
        });
      }

      // mark finished: clear progress and mark read-only
      localStorage.removeItem(FORM_KEY);
      localStorage.removeItem(MESSAGES_KEY);
      localStorage.removeItem(CHAT_ID_KEY);

      setIsReadonly(true);
      setSubmitting(false);
    } catch (err) {
      console.error("Final submit error:", err);
      await pushMessageToStateAndServer({
        content: "⚠️ Server error during account creation. Please try again later.",
        role: "bot"
      });
      setSubmitting(false);
    }
  }

  // Primary sendMessage handler for text or file
  async function sendMessage({ message = "", file = null }) {
    if (isReadonly) return;

    // ensure chatId exists before saving messages
    if (!chatId) {
      // try to create synchronously if not present
      try {
        const resp = await Axios.post("/api/chats/createaccount", { newchat: true, userId });
        const newId = resp.data?.chatId || resp.data?.id || null;
        if (newId) {
          localStorage.setItem(CHAT_ID_KEY, newId);
          setChatId(newId);
        }
      } catch (err) {
        console.error("Could not create chat before message:", err);
      }
    }

    const form = getForm();
    const step = steps[form.progressIndex];

    // Add user's message locally & server
    const userText = file ? `📎 ${file.name} Submitted` : message;
    await pushMessageToStateAndServer({ content: userText, role: "user" });

    // Handle file steps
    if (step.isFile) {
      if (!file) {
        // ask again for file
        await pushMessageToStateAndServer({ content: step.prompt, role: "bot" });
        return;
      }

      // Upload file
      try {
        // show an uploading indicator message
        await pushMessageToStateAndServer({ content: `Uploading ${file.name}...`, role: "bot" });

        const url = await uploadFileToServer(file, step.key);
        if (!url) throw new Error("No URL returned");

        form[step.key] = url;
        // Save that file URL as a bot message (confirmation)
        await pushMessageToStateAndServer({ content: `Uploaded ${file.name}`, role: "bot" });
      } catch (err) {
        console.error("File upload error:", err);
        await pushMessageToStateAndServer({ content: "⚠️ File upload failed. Please try again.", role: "bot" });
        return;
      }
    } else {
      // normal text input -> store in form
      form[step.key] = message;
    }

    // progress step
    form.progressIndex = (form.progressIndex || 0) + 1;
    saveForm(form);

    if (form.progressIndex < steps.length) {
      const nextPrompt = steps[form.progressIndex].prompt;
      await pushMessageToStateAndServer({ content: nextPrompt, role: "bot" });
    } else {
      // Finished all steps: show processing UI and call final submit
      await pushMessageToStateAndServer({ content: "Processing your information... ⏳", role: "bot" });
      await finishAndSubmitToServer();
    }

    setInput("");
  }

  // Input handlers
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="p-4 bg-blue-600 text-white text-xl font-bold shadow">
        Create Account
      </header>

      <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs p-3 rounded-2xl shadow-md text-sm ${m.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none"}`}
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
          disabled={isReadonly}
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={async e => {
            const f = e.target.files[0];
            if (f) await sendMessage({ file: f });
            e.target.value = null;
          }}
          disabled={isReadonly}
        />

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isReadonly ? "Chat is read-only" : "Type a message..."}
          className="flex-1 p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isReadonly}
        />

        <button
          disabled={!input.trim() || isReadonly}
          onClick={async () => {
            if (!input.trim()) return;
            await sendMessage({ message: input.trim() });
          }}
          className={`p-3 rounded-full text-white ${input.trim() && !isReadonly ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}
        >
          <Send size={18} />
        </button>

        {/* Processing / final submit state indicator */}
        {submitting && (
          <div className="ml-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded">Processing...</div>
        )}
      </div>
    </div>
  );
}
