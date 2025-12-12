import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"
import { analyzeImageWithGemini } from "@/lib/gemini-client"
import azureStorage from "@/components/azure"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const formData = await req.formData()
    const name = formData.get("name")
    const aadhaarNo = formData.get("aadhaarNo")
    const dob = formData.get("dob")
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type - now accepting images
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF files are accepted." }, { status: 400 })
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
        'aadhaar'
      )
      console.log("[v0] File uploaded to Azure:", uploadResult.url)

      // If it's an image or PDF, analyze with Gemini
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const geminiPrompt = `Analyze this Aadhaar card image and extract the following information in JSON format:
        {
          "name": "extracted name",
          "aadhaarNumber": "extracted aadhaar number (12 digits)",
          "dateOfBirth": "extracted date of birth (DD/MM/YYYY format)",
          "success": true/false,
          "confidence": "high/medium/low"
        }

        If you cannot clearly read the information or if this is not a valid Aadhaar card, set success to false and provide an error message.`

        const geminiResponse = await analyzeImageWithGemini(fileBuffer, file.type, geminiPrompt)
        
        try {
          // Parse Gemini response - handle markdown code blocks
          let jsonString = geminiResponse
          
          // Remove markdown code blocks if present
          if (geminiResponse.includes('```json')) {
            jsonString = geminiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          } else if (geminiResponse.includes('```')) {
            jsonString = geminiResponse.replace(/```\n?/g, '').trim()
          }
          
          // Parse the cleaned JSON
          const extractedData = JSON.parse(jsonString)
          
          if (!extractedData.success) {
            return NextResponse.json({ 
              error: "Unable to extract data from Aadhaar image",
              details: extractedData.error || "Invalid or unclear Aadhaar card image"
            }, { status: 400 })
          }

          // Validate extracted data against user input
          const errors = []
          
          if (name && extractedData.name && extractedData.name.toLowerCase() !== name.toLowerCase()) {
            errors.push(`Name mismatch: Expected "${name}", found "${extractedData.name}"`)
          }
          
          if (aadhaarNo && extractedData.aadhaarNumber && extractedData.aadhaarNumber.replace(/\s/g, '') !== aadhaarNo.replace(/\s/g, '')) {
            errors.push(`Aadhaar number mismatch: Expected "${aadhaarNo}", found "${extractedData.aadhaarNumber}"`)
          }
          
          if (dob && extractedData.dateOfBirth && extractedData.dateOfBirth !== dob) {
            errors.push(`Date of birth mismatch: Expected "${dob}", found "${extractedData.dateOfBirth}"`)
          }

          if (errors.length > 0) {
            return NextResponse.json({
              error: "Validation failed",
              errorCode: "VALIDATION_MISMATCH",
              details: errors,
              extracted: extractedData,
              provided: { name, aadhaarNo, dob }
            }, { status: 400 })
          }

          // Update onboarding record
          await Onboarding.findOneAndUpdate(
            { userId: session.user.id }, 
            { 
              "data.aadhaarUrl": uploadResult.url,
              "data.aadhaarData": extractedData,
              "data.validatedAt": new Date()
            }, 
            { upsert: true }
          )

          return NextResponse.json({
            success: true,
            message: "Aadhaar uploaded and validated successfully",
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            extractedData: extractedData,
            validation: "passed"
          })

        } catch (parseError) {
          console.error("[v0] Failed to parse Gemini response:", parseError)
          return NextResponse.json({
            error: "Failed to analyze Aadhaar document",
            errorCode: "ANALYSIS_FAILED",
            details: "Unable to process the document data"
          }, { status: 500 })
        }

      } else {
        // For unsupported file types, just upload without analysis
        await Onboarding.findOneAndUpdate(
          { userId: session.user.id }, 
          { "data.aadhaarUrl": uploadResult.url }, 
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: "Aadhaar document uploaded successfully",
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          note: "Document analysis not supported for this file type, manual verification required"
        })
      }

    } catch (uploadError) {
      console.error("[v0] Azure upload failed:", uploadError)
      return NextResponse.json({
        error: "Failed to upload file",
        errorCode: "UPLOAD_FAILED",
        details: uploadError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[v0] Aadhaar upload error:", error)
    return NextResponse.json({
      error: "Upload failed",
      errorCode: "GENERAL_ERROR",
      details: error.message
    }, { status: 500 })
  }
}