import { NextResponse } from "next/server"

// Simple API returning user and account info.
// Replace with real DB/auth integration as needed.
export async function GET() {
  const user = {
    name: "user1",
    email: "user1@example.com",
  }

  const account = {
    number: "1234567890",
    type: "Savings",
    branch: "Downtown Branch",
    opened: "2022-03-10",
    ifsc: "BANK0001234",
    balance: 12458.75,
    currency: "USD",
  }

  return NextResponse.json({ user, account })
}
