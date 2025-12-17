import { NextResponse } from "next/server"

// Returns recent activity items
export async function GET() {
  const activity = [
    { id: 1, time: "2025-11-20 09:12", text: "Uploaded Aadhaar document", meta: "Document" },
    { id: 2, time: "2025-11-18 14:05", text: "Started Personal Loan application", meta: "Application" },
    { id: 3, time: "2025-11-15 11:32", text: "Chat with Sales Agent about savings account", meta: "Chat" },
  ]

  return NextResponse.json({ activity })
}
