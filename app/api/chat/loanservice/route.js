import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import LoanChat from "@/models/LoanChat"

// Get all loan chats for current user
export async function GET(req) {
	try {
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		const chats = await LoanChat.find({ userId: session.user.id })
			.sort({ updatedAt: -1 })
			.lean()

		return NextResponse.json({ chats })
	} catch (error) {
		console.error("Error fetching loan chats:", error)
		return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
	}
}

// Create new loan chat
export async function POST(req) {
	try {
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		const newChat = await LoanChat.create({
			userId: session.user.id,
		})

		return NextResponse.json({ chat: newChat }, { status: 201 })
	} catch (error) {
		console.error("Error creating loan chat:", error)
		return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
	}
}
