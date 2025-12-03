import { NextResponse } from "next/server"
import { auth } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"

export async function POST(req) {
  try {
    const session = await auth()

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
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Only PDF files are accepted." }, { status: 400 })
    }

    // Create mock file URL
    const fileName = `pan-${session.user.id}-${Date.now()}.pdf`
    const fileUrl = `/uploads/pan/${fileName}`

    // Update onboarding record with file reference
    await Onboarding.findOneAndUpdate({ userId: session.user.id }, { "data.panUrl": fileUrl }, { upsert: true })

    console.log("[v0] PAN file uploaded:", fileUrl)

    return NextResponse.json({
      url: fileUrl,
      fileName,
      message: "PAN uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] PAN upload error:", error)
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 })
  }
}
