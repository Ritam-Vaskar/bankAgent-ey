import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Account from "@/models/Account"
import Onboarding from "@/models/Onboarding"

export async function POST(req) {
  try {
    await connectDB()

    const { userId, personalData, kycData } = await req.json()

    if (!userId || !personalData || !kycData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate 12-digit account number
    const accountNumber = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0")

    // Create account in database
    const account = new Account({
      userId,
      accountNumber,
      kycVerified: true,
    })

    await account.save()

    // Update onboarding status
    await Onboarding.findOneAndUpdate(
      { userId },
      {
        status: "MCP_CREATED",
        step: "final",
        "data.accountNumber": accountNumber,
      },
    )

    const response = {
      status: "CREATED",
      account_number: accountNumber,
      message: `Your account has been created successfully. Account Number: ${accountNumber}`,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] MCP account created:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] MCP account creation error:", error)
    return NextResponse.json({ error: "Account creation failed" }, { status: 500 })
  }
}
