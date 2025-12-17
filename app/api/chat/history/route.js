import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const chats = await Chat.find({ userId: session.user.id })
      .select("title status lastMessageAt createdAt messages")
      .sort({ lastMessageAt: -1 })
      .limit(20)
      .lean();

    // Format for frontend
    const formattedChats = chats.map((chat) => ({
      id: chat._id.toString(),
      title: chat.title,
      status: chat.status,
      time: getRelativeTime(chat.lastMessageAt),
      messageCount: chat.messages?.length || 0,
      lastMessage: chat.messages?.[chat.messages.length - 1]?.content?.substring(0, 50),
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}
