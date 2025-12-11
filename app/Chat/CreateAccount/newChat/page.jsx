"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Axios from "axios";
import React from "react";

export default function CreateAccountChatPage({ searchParams }) {
  const { data: session } = useSession();

  // ✔ FIX: unwrap searchParams properly using React.use()
  const { chatId } = React.use(searchParams);

  const FORM_KEY = "create_account_form";
  const [messages, setMessages] = useState([]); // safe array
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing chat when chatId changes
  useEffect(() => {
    async function loadChat() {
      if (!chatId) return;

      try {
        const res = await Axios.get(`/api/chat/fetch?chatId=${chatId}`);
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    }

    loadChat();
  }, [chatId]);

  // Send Message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);

    setInput("");

    try {
      const res = await Axios.post("/api/chat/createaccount", {
        message: input,
        chatId,
        user: session?.user?.email,
      });

      if (res.data?.botMessage) {
        setMessages((prev) => [...prev, res.data.botMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <>
      {/* CHAT WINDOW */}
      <div className="flex flex-col h-screen p-4">
        <h1 className="text-xl font-bold">Create Account Chat</h1>

        <div className="flex-1 overflow-y-auto mt-4 bg-gray-900 p-3 rounded-lg">
          {/* ✔ FIX: safe map rendering */}
          {messages?.map((m, i) => (
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

        {/* INPUT BOX */}
        <div className="flex items-center gap-2 mt-4">
          <input
            className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />

          <button
            onClick={sendMessage}
            className="p-2 bg-blue-600 text-white rounded-lg"
          >
            <Send />
          </button>
        </div>
      </div>
    </>
  );
}
