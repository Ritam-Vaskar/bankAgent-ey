"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Axios from "axios";

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();

  const [chat, setChat] = useState([]);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatTitle, setSelectedChatTitle] = useState("");

  // ---------------- FETCH CHAT LIST ---------------
  useEffect(() => {
    const id = session?.user?.id;
    if (!id) return;

    const fetchChat = async () => {
      try {
        const response = await Axios.get(
          "/api/chat/createaccount?userId=" + id
        );

        const da = response.data.chatName || [];

        let index = 1;

        const allChat = da.map((c) => {
          const chatId = c._id || c.id || c.chatId;

          return {
            ...c,
            name: `Chat ${index++}`,
            id: chatId,
          };
        });

        setChat(allChat);
      } catch (err) {
        console.error("Error fetching chat:", err);
      }
    };

    fetchChat();
  }, [session]);

  // ---------------- PREVIEW CHAT ------------------
  const redirectTochat = async (id) => {
    const res = await Axios.get(`/api/chat/createaccount?chatId=${id}`);
    const messages = res.data.Allmessages || [];

    setPreviewMessages(messages);
    setSelectedChatId(id);

    const chatInfo = chat.find((c) => c.id === id);
    setSelectedChatTitle(chatInfo?.name || "Selected Chat");
  };

  // ---------------- CLOSE PREVIEW ------------------
  const closePreview = () => {
    setPreviewMessages([]);
    setSelectedChatId(null);
    setSelectedChatTitle("");
  };

  // ---------------- CREATE NEW CHAT ----------------
  const createNewChat = async () => {
    const userId = session?.user?.id;

    if (!userId) {
      alert("User Not Found");
      return;
    }

    const response = await Axios.post(`/api/chat/createaccount`, {
      userId: userId,
      newchat: true,
    });

    const data = response.data;

    router.push(
      `/Chat/CreateAccount/newChat?userId=${userId}&chatId=${data.chatId}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center mb-6">
          Create Account – Chat History
        </h1>

        {/* CHAT LIST */}
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Past Chats</h2>

          {chat.length > 0 ? (
            <div className="space-y-4">
              {chat.map((c) => (
                <div
                  key={c.id}
                  className={`flex justify-between items-center p-4 rounded-xl border transition
                    ${
                      selectedChatId === c.id
                        ? "bg-blue-900 border-blue-500"
                        : "bg-gray-900 border-gray-700 hover:bg-gray-800"
                    }`}
                >
                  <p className="font-medium text-lg">{c.name}</p>

                  <button
                    onClick={() => redirectTochat(c.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg text-white shadow"
                  >
                    View Chat
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No past chats found.</p>
          )}
        </div>

        {/* CHAT PREVIEW */}
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Chat Preview</h2>

          {previewMessages.length > 0 ? (
            <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 shadow space-y-4">
              {/* PREVIEW HEADER */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-300">
                  {selectedChatTitle}
                </h3>

                <button
                  onClick={closePreview}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                >
                  Close
                </button>
              </div>

              {/* MESSAGES */}
              {previewMessages.map((msg, i) => (
                <div
                  key={msg._id || i}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <p className="text-sm text-gray-300">
                    <strong className="text-blue-400">
                      {msg.sender === "user" ? "User" : "Bot"}:
                    </strong>{" "}
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No chat selected.</p>
          )}
        </div>

        {/* NEW CHAT */}
        <div className="text-center mt-6">
          <h2 className="text-2xl font-semibold mb-4">Start a New Chat</h2>

          <button
            onClick={createNewChat}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 transition rounded-xl text-white font-semibold shadow-lg"
          >
            Create New Chat
          </button>
        </div>
      </div>
    </div>
  );
}
