import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import CreateaccountChat from "@/models/CreateaccountChat"
import CreateaccountMessage from "@/models/CreateaccountMessage"

// Get specific create account chat
export async function GET(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		const chat = await CreateaccountChat.findOne({
			_id: chatId,
			userId: session.user.id,
		}).lean()

		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		const messages = await CreateaccountMessage.find({ chatId }).sort({ createdAt: 1 }).lean()

		return NextResponse.json({ chat, messages })
	} catch (error) {
		console.error("Error fetching create account chat:", error)
		return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
	}
}

// Delete create account chat
export async function DELETE(req, { params }) {
	try {
		const { chatId } = await params
		console.log("DELETE request for CreateAccount chat:", chatId)
		
		const session = await getServerSession(authOptions)
		if (!session) {
			console.log("Unauthorized: No session found")
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		// Delete the chat
		const result = await CreateaccountChat.deleteOne({
			_id: chatId,
			userId: session.user.id,
		})

		console.log("Chat deletion result:", result.deletedCount, "deleted")

		if (result.deletedCount === 0) {
			console.log("Chat not found or doesn't belong to user")
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		// Also delete all associated messages
		const messagesResult = await CreateaccountMessage.deleteMany({ chatId })
		console.log("Deleted", messagesResult.deletedCount, "messages for chat", chatId)

		return NextResponse.json({ message: "Chat deleted successfully" })
	} catch (error) {
		console.error("Error deleting create account chat:", error)
		return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
	}
}
