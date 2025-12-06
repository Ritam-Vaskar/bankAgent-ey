import { NextResponse } from "next/server"

// Returns chat history for the current user.
// Replace with DB fetch using session info.
export async function GET() {
  const chatHistory = [
    { id: 1, time: "2025-11-20 09:12", agent: "Master Agent", summary: "KYC status and account setup", status: "Resolved" },
    { id: 2, time: "2025-11-18 14:05", agent: "Verification Agent", summary: "Document upload verification", status: "In Progress" },
    { id: 3, time: "2025-11-17 08:22", agent: "Sales Agent", summary: "Loan inquiry", status: "Follow-up" },
  ]

  return NextResponse.json({ chatHistory })
}
