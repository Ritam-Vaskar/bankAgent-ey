import { NextResponse } from "next/server"

// Returns user's loan/credit applications
export async function GET() {
  const applications = [
    { id: "L-1001", type: "Personal Loan", applied: "2025-11-18", amount: 5000, status: "Under Review" },
    { id: "C-2002", type: "Credit Card", applied: "2025-10-02", amount: null, status: "Approved" },
  ]

  return NextResponse.json({ applications })
}
