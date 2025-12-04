import { NextResponse } from "next/server"
import { auth } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"

export async function GET(req) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const onboarding = await Onboarding.findOne({ userId: session.user.id })

    if (!onboarding) {
      return NextResponse.json({ messages: [] })
    }

    // Return conversation state
    return NextResponse.json({
      messages: [],
      status: onboarding.status,
      step: onboarding.step,
      data: onboarding.data,
    })
  } catch (error) {
    console.error("[v0] Chat history error:", error)
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
  }
}
