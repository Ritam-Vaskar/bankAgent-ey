import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, message, role } = await req.json();

    if (!chatId || !message || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Add message
    chat.messages.push({
      role,
      content: message,
      timestamp: new Date(),
    });

    // Update title based on first user message
    if (chat.messages.length === 1 && role === "user") {
      chat.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    chat.lastMessageAt = new Date();
    await chat.save();

    return NextResponse.json({
      message: "Message added successfully",
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        messages: chat.messages,
      },
    });
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
