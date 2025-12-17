import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import azureStorage from "@/components/Azure"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      "image/jpeg", 
      "image/jpg", 
      "image/png", 
      "image/gif", 
      "image/webp", 
      "application/pdf"
    ]
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only images and PDF files are accepted." 
      }, { status: 400 })
    }

    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    try {
      // Upload to Azure using centralized service
      const uploadResult = await azureStorage.uploadDocument(
        fileBuffer, 
        file.name, 
        file.type, 
        session.user.id, 
        'documents'
      )
      
      console.log("File uploaded to Azure:", uploadResult.url)

      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        filename: file.name
      })

    } catch (uploadError) {
      console.error("Azure upload error:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file to Azure Storage" 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "File upload failed" 
    }, { status: 500 })
  }
}
