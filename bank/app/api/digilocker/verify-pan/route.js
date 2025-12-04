import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { panUrl } = await req.json()

    if (!panUrl) {
      return NextResponse.json({ error: "PAN URL is required" }, { status: 400 })
    }

    // Mock DigiLocker PAN verification
    const mockResponse = {
      verified: true,
      extracted: {
        pan: "ABCDE1234F",
        name: "John Doe",
        dob: "1995-05-15",
        fatherName: "Richard Doe",
        status: "Active",
      },
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] DigiLocker PAN verification mock response:", mockResponse)

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("[v0] DigiLocker PAN error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
