import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const onboarding = await Onboarding.findOne({ userId: session.user.id })

    if (!onboarding) {
      return NextResponse.json({ status: "INIT", step: "name", data: {} })
    }

    return NextResponse.json({
      status: onboarding.status,
      step: onboarding.step,
      data: onboarding.data,
    })
  } catch (error) {
    console.error("[v0] Onboarding state error:", error)
    return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { status, step, data } = await req.json()

    const onboarding = await Onboarding.findOneAndUpdate(
      { userId: session.user.id },
      { status, step, data, updatedAt: new Date() },
      { upsert: true, new: true },
    )

    return NextResponse.json(onboarding)
  } catch (error) {
    console.error("[v0] Onboarding state update error:", error)
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 })
  }
}
