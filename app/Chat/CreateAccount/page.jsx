"use client";

import { useState, useEffect } from "react";
import { useSession ,signIn} from "next-auth/react";
import { useRouter } from "next/navigation";
import Axios from "axios"
export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();

  const [chat, setChat] = useState([]);
  const [previewMessage, setPreviewMessage] = useState(null);

  // Fetch all past chats
  useEffect(() => {
   const id = session?.user?.id;
   console.log(id)


    const fetchChat = async () => {
      const response = await Axios.get("/api/chat/createaccount?userId=" + id);
      const data = await response.data;
      setChat(Array.isArray(data) ? data : []);
    };
    fetchChat();
  }, []);

  // Show selected chat preview
  const redirectTochat = async (id) => {
    const res = await fetch(`/api/chat/createaccount?chatId=${id}`);
    const data = await res.json();
    setPreviewMessage(data);
  };

  // Create new chat
  const createNewChat = async () => {
    const userId = session?.user?.id;

    if (!userId) {
      alert("User Not Found");
      return;
    }

    const response = await Axios.post(
      `/api/chat/createaccount`,
      {
        userId: userId,
        newchat: true
      }
    );

    const data = response.data;
    console.log(data)

    router.push(
      `/Chat/CreateAccount/newChat?userId=${userId}&chatId=${data.chatId}`
    );
  };

  return (
    <>
      <div>
        <h1>All Past Chats For Creating Account</h1>

        {chat &&
          chat.map((c) => (
            <div key={c.id}>
              <p>{c.name}</p>
              <button onClick={() => redirectTochat(c.id)}>
                View This Chat
              </button>
            </div>
          ))}

        <h2>Current Chat Preview</h2>

        {previewMessage ? (
          <div>
            <p>{previewMessage.content}</p>
          </div>
        ) : (
          <p>No chat previewing</p>
        )}
      </div>

      <div>
        <h1>Create New Chat</h1>
        <button onClick={createNewChat}>Create</button>
      </div>
    </>
  );
}
