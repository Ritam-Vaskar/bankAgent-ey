// app/api/chat/createaccount/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import connectDB from "@/lib/mongodb";
import CreateaccountChat from "@/models/CreateaccountChat";

// Get all create account chats for current user
export async function GET(req) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		const chats = await CreateaccountChat.find({ userId: session.user.id })
			.sort({ updatedAt: -1 })
			.lean();

		return NextResponse.json({ chats });
	} catch (error) {
		console.error("Error fetching create account chats:", error);
		return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
	}
}

// Create new create account chat
export async function POST(req) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		const newChat = await CreateaccountChat.create({
			userId: session.user.id,		isOpened: true,		});

		return NextResponse.json({ chat: newChat }, { status: 201 });
	} catch (error) {
		console.error("Error creating create account chat:", error);
		return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
	}
}
