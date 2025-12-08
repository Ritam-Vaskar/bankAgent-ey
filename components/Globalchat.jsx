"use client";

import { useState } from "react";

import Axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function GlobalChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const { data : session } = useSession();
 

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setLoading(true);

    try {
      console.log(session)
      const res = await Axios.post("/api/chat/agent", {
        input: input,
        userId: session.user.id,
      });

      const data = res.data;
      console.log("Response from agent route:", data);

      if (data.message.includes("/api/chat/loan")) {
        alert("Redirect to Loan Service"); // placeholder
        router.push("/Chat/LoanService");
      } 
      else if (data.message.includes("/api/chat/account")) {
        
        router.push("/Chat/CreateAccount");
     
      }
      else if (data.message.includes("/api/chat/creditcard"))
        {
          alert("Redirect to Credit Card Service"); // placeholder
          router.push("/Chat/Creditcardservice");
        }
         else {
           const AdminMessage = { role: "bot", content: "No service found", timestamp: new Date() };
        setMessages((prev) => [...prev, AdminMessage]);

      }

    } catch (error) {
      console.error("Error calling Gemini:", error);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        <h1>This is Messaging Section</h1>

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-2 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-500 text-white self-end"
                : "bg-gray-300 text-black self-start"
            }`}
          >
            {msg.content}
          </div>
        ))}

      </div>

      <div className="flex items-center p-4 bg-white border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
