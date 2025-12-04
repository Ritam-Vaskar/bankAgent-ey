import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["application/pdf", "application/xml", "text/xml"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and XML files are accepted." }, { status: 400 })
    }

    // Create mock file URL
    const fileName = `aadhaar-${session.user.id}-${Date.now()}.${file.type === "application/pdf" ? "pdf" : "xml"}`
    const fileUrl = `/uploads/aadhaar/${fileName}`

    // Update onboarding record with file reference
    await Onboarding.findOneAndUpdate({ userId: session.user.id }, { "data.aadhaarUrl": fileUrl }, { upsert: true })

    console.log("[v0] Aadhaar file uploaded:", fileUrl)

    return NextResponse.json({
      url: fileUrl,
      fileName,
      message: "Aadhaar uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Aadhaar upload error:", error)
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 })
  }
}
