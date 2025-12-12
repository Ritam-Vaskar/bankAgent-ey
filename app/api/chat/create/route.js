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

    await connectDB();

    const newChat = await Chat.create({
      userId: session.user.id,
      title: "New Chat",
      messages: [],
      status: "active",
    });

    return NextResponse.json({
      chatId: newChat._id.toString(),
      message: "New chat created",
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
