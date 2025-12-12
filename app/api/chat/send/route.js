import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"
import { processMasterAgentMessage } from "@/agents/master-agent"
import { mockVerifyAadhaar, mockVerifyPan } from "@/agents/worker-kyc"
import { processWorkerMCP } from "@/agents/worker-mcp"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { message, userId, flow } = await req.json()

    if (!message || !flow) {
      return NextResponse.json({ error: "Message and flow are required" }, { status: 400 })
    }

    // Get or create onboarding record
    let onboarding = await Onboarding.findOne({ userId: session.user.id })
    if (!onboarding) {
      onboarding = new Onboarding({ userId: session.user.id })
      await onboarding.save()
    }

    console.log("[v0] Current step:", onboarding.step)
    console.log("[v0] User message:", message)

    let response = {}

    // Route based on current step
    if (onboarding.step === "aadhaar" && message.includes("uploaded")) {
      // Handle Aadhaar upload
      onboarding.data.aadhaarUrl = message
      onboarding.step = "pan"
      await onboarding.save()

      response = {
        message: "Great! Aadhaar received. Now please upload your PAN document:",
        action: "request_upload",
        docType: "pan",
      }
    } else if (onboarding.step === "pan" && message.includes("uploaded")) {
      // Handle PAN upload
      onboarding.data.panUrl = message

      // Trigger KYC verification
      console.log("[v0] Triggering KYC verification...")

      try {
        // Mock KYC verification
        // const kycResult = await mockVerifyAadhaar(onboarding.data.aadhaarUrl)
        // const panResult = await mockVerifyPan(onboarding.data.panUrl)

        if (kycResult.verified && panResult.verified) {
          onboarding.data.aadhaarData = kycResult.extracted
          onboarding.data.panData = panResult.extracted
          onboarding.status = "VERIFIED"
          onboarding.step = "verification"
          await onboarding.save()

          console.log("[v0] KYC verified, creating account...")

          // Create account via MCP
          const mcpResult = await processWorkerMCP(
            session.user.id,
            { aadhaar: kycResult.extracted, pan: panResult.extracted },
            onboarding.data,
          )

          if (mcpResult.status === "CREATED") {
            onboarding.data.accountNumber = mcpResult.account_number
            onboarding.status = "COMPLETED"
            onboarding.step = "final"
            await onboarding.save()

            response = {
              message: `Account created successfully! Your Account Number: ${mcpResult.account_number}`,
              action: "complete",
            }
          }
        } else {
          response = {
            message: "Document verification failed. Please try again with valid documents.",
            action: "continue",
          }
        }
      } catch (error) {
        console.error("[v0] KYC/MCP error:", error)
        response = {
          message: "An error occurred during verification. Please try again.",
          action: "continue",
        }
      }
    } else {
      // Use Master Agent for regular flow
      const agentResponse = await processMasterAgentMessage(message, session.user.id)

      response = {
        message: agentResponse.message,
        action: agentResponse.action || "continue",
        docType: agentResponse.docType,
      }

      // Update onboarding record with latest state
      const updatedOnboarding = await Onboarding.findOne({ userId: session.user.id })
      if (updatedOnboarding) {
        onboarding = updatedOnboarding
      }
    }
    
    console.log("[v0] Chat response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Chat processing failed", details: error.message }, { status: 500 })
  }
}
