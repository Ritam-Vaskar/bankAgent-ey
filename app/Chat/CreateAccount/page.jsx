"use client";

import { useState, useEffect } from "react";
import ChatPreview from "./Preview/page";
import CreateAccountChatPage from "./newChat/page";
import { MessageSquarePlus, History } from "lucide-react";
import Axios from "axios";
import { useSession } from "next-auth/react";

export default function ChatPageLayout() {
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newChatId, setnewChatid] = useState(null);

  const { data: session } = useSession();

  // Fetch chat history
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await Axios.get("/api/chat/createaccount");
        console.log("Fetched chats:", res.data);

        setChatList(res.data || []); // Actual DB response
      } catch (err) {
        console.error("Error fetching chats", err);
      }
    }
    fetchChats();
  }, []);

  // Start new chat
  async function performFunction() {
    try {
      const res = await Axios.post("/api/chat/createaccount", {
        newchat: true,
        userId: session?.user?.id,
      });

      console.log("New chat created:", res.data);

      const chatId = res.data.chatId;
      setnewChatid(chatId);

      // Activate NEW chat
      setActiveChat("new");
    } catch (err) {
      console.error("Error creating new chat", err);
    }
  }

  return (
    <div className="h-screen w-full flex bg-gray-100">
      
      {/* LEFT SIDEBAR */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        
        <div className="p-4 font-bold text-lg border-b flex items-center gap-2 bg-purple-600 text-white">
          <History size={20} /> Past Chats
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatList.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              No chats available.
            </p>
          ) : (
            chatList.map((chat) => (
              <button
                key={chat.id}
                className="w-full text-left p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition shadow"
                onClick={() => setActiveChat(chat.id)}
              >
                {chat.title}
              </button>
            ))
          )}
        </div>

        <div className="border-t h-1/2 overflow-y-auto">
          <ChatPreview />
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquarePlus size={60} className="text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Start a New Chat</h2>
            <p className="text-gray-600 mb-4">
              Click the button to begin account creation.
            </p>

            <button
              onClick={performFunction}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700 shadow"
            >
              New Chat
            </button>
          </div>
        ) : activeChat === "new" ? (
          <CreateAccountChatPage chatId={newChatId} />
        ) : (
          <ChatPreview chatId={activeChat} />
        )}
      </div>
    </div>
  );
}
