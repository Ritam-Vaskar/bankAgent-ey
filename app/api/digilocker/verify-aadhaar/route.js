import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { aadhaarUrl } = await req.json()

    if (!aadhaarUrl) {
      return NextResponse.json({ error: "Aadhaar URL is required" }, { status: 400 })
    }

    // Mock DigiLocker Aadhaar verification
    const mockResponse = {
      verified: true,
      extracted: {
        aadhaarNumber: "123456789012",
        name: "John Doe",
        dob: "1995-05-15",
        gender: "Male",
        address: "123 Main Street, Mumbai, Maharashtra 400001",
      },
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] DigiLocker Aadhaar verification mock response:", mockResponse)

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("[v0] DigiLocker Aadhaar error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
