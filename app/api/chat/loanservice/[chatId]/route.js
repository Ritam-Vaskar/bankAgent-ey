import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import LoanChat from "@/models/LoanChat"
import LoanMessage from "@/models/LoanMessage"

// Get specific loan chat
export async function GET(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		const chat = await LoanChat.findOne({
			_id: chatId,
			userId: session.user.id,
		}).lean()

		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		return NextResponse.json({ chat })
	} catch (error) {
		console.error("Error fetching loan chat:", error)
		return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
	}
}

// Delete loan chat
export async function DELETE(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		// Delete the chat
		const result = await LoanChat.deleteOne({
			_id: chatId,
			userId: session.user.id,
		})

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		// Also delete all associated messages
		await LoanMessage.deleteMany({ chatId })

		return NextResponse.json({ message: "Chat deleted successfully" })
	} catch (error) {
		console.error("Error deleting loan chat:", error)
		return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
	}
}
