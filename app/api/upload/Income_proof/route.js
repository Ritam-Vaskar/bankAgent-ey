import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { analyzeImageWithGemini } from "@/lib/gemini-client"
import azureStorage from "@/components/azure"

// Extract income details from salary slip / ITR / GST return using Gemini
export async function POST(req) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const contentType = req.headers.get("content-type") || ""
		let fileBuffer, fileName, fileType, uploadResult

		// Check if request is JSON with documentUrl or FormData with file
		if (contentType.includes("application/json")) {
			const body = await req.json()
			const documentUrl = body.documentUrl

			if (!documentUrl) {
				return NextResponse.json({ error: "No documentUrl provided" }, { status: 400 })
			}

			// Fetch document from URL
			const docResponse = await fetch(documentUrl)
			if (!docResponse.ok) {
				return NextResponse.json({ error: "Failed to fetch document from URL" }, { status: 400 })
			}

			const arrayBuffer = await docResponse.arrayBuffer()
			fileBuffer = Buffer.from(arrayBuffer)
			fileType = docResponse.headers.get("content-type") || "application/pdf"
			fileName = documentUrl.split('/').pop() || "income-proof"
			uploadResult = { url: documentUrl, fileName: fileName }
		} else {
			// Original FormData handling
			const formData = await req.formData()
			const file = formData.get("file")

			if (!file) {
				return NextResponse.json({ error: "No file provided" }, { status: 400 })
			}

			// Accept common images and PDFs
			const validTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
				"application/pdf",
			]
			if (!validTypes.includes(file.type)) {
				return NextResponse.json(
					{ error: "Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF files are accepted." },
					{ status: 400 },
				)
			}

			fileBuffer = Buffer.from(await file.arrayBuffer())
			fileName = file.name
			fileType = file.type

			// Upload to Azure Blob first (keeps an auditable copy)
			uploadResult = await azureStorage.uploadDocument(
				fileBuffer,
				file.name,
				file.type,
				session.user.id,
				"income-proof",
			)
			console.log("[v0] Income proof uploaded to Azure:", uploadResult.url)
		}

		try {
			// Ask Gemini to extract income fields in a strict JSON format
			const geminiPrompt = `You are reading an Indian income document: salary slip, ITR (Income Tax Return), or GST return.
Carefully read the document and return a STRICT JSON object with ONLY these fields:
{
	"documentType": "salary_slip | itr | gst_return | unknown",
	"monthlyGrossSalary": number | null,
	"monthlyNetSalary": number | null,
	"annualGrossIncome": number | null,
	"annualNetIncome": number | null,
	"gstTurnover": number | null,
	"currency": "INR",
	"success": true | false,
	"confidence": "high" | "medium" | "low"
}

Rules:
- Interpret amounts in Indian numbering (₹, commas like 1,23,456). Return numbers as plain numeric values without commas or currency symbols.
- If a field is not present, set it to null (not 0).
- DO NOT add extra keys. DO NOT wrap in markdown. Output raw JSON only.`

			const geminiResponse = await analyzeImageWithGemini(fileBuffer, fileType, geminiPrompt)

			// Some models wrap JSON in ``` blocks: strip them safely
			let jsonString = geminiResponse
			if (jsonString.includes("```json")) {
				jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
			} else if (jsonString.includes("```")) {
				jsonString = jsonString.replace(/```\n?/g, "").trim()
			}

			// Robust JSON parsing: handle fenced or truncated JSON by extracting the first valid object
			let extracted
			const tryParse = (str) => {
				try { return JSON.parse(str) } catch { return null }
			}
			extracted = tryParse(jsonString)
			if (!extracted) {
				// Attempt to find the substring between the first '{' and the last '}'
				const firstBrace = jsonString.indexOf('{')
				const lastBrace = jsonString.lastIndexOf('}')
				if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
					const candidate = jsonString.slice(firstBrace, lastBrace + 1)
					extracted = tryParse(candidate)
				}
			}
			if (!extracted) {
				// Attempt to fix common truncation: remove trailing comma and add missing closing brace
				let candidate = jsonString
				// Remove code fences again defensively
				candidate = candidate.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
				// If the last non-whitespace is a comma, drop only that final comma
				candidate = candidate.replace(/,\s*$/, '')
				// If missing closing brace, add one
				if (!candidate.trim().endsWith('}')) candidate = candidate + '}'
				const parsed = tryParse(candidate)
				if (parsed) extracted = parsed
			}
			if (!extracted) {
				// Progressive trimming of trailing lines to reach a valid JSON
				const lines = jsonString.split('\n')
				while (lines.length > 0) {
					let candidate = lines.join('\n')
					candidate = candidate.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
					// Remove only a trailing end-of-string comma
					candidate = candidate.replace(/,\s*$/, '')
					if (!candidate.trim().endsWith('}')) candidate = candidate + '}'
					const parsed = tryParse(candidate)
					if (parsed) { extracted = parsed; break }
					lines.pop()
				}
			}
			if (!extracted) {
				console.error("[v0] Income proof parse error: unable to parse JSON", "raw:", geminiResponse)
				return NextResponse.json(
					{ error: "Failed to analyze income document", errorCode: "ANALYSIS_PARSE_FAILED" },
					{ status: 500 },
				)
			}

			// Normalize numeric fields if strings slipped through
			const toNumber = (v) => {
				if (v === null || v === undefined || v === "") return null
				if (typeof v === "number") return v
				if (typeof v === "string") {
					const cleaned = v.replace(/[^0-9.\-]/g, "")
					const num = Number(cleaned)
					return Number.isFinite(num) ? num : null
				}
				return null
			}

			const result = {
				documentType: extracted.documentType || "unknown",
				monthlyGrossSalary: toNumber(extracted.monthlyGrossSalary),
				monthlyNetSalary: toNumber(extracted.monthlyNetSalary),
				annualGrossIncome: toNumber(extracted.annualGrossIncome),
				annualNetIncome: toNumber(extracted.annualNetIncome),
				gstTurnover: toNumber(extracted.gstTurnover),
				currency: extracted.currency || "INR",
				success: Boolean(extracted.success),
				confidence: extracted.confidence || "low",
			}

			return NextResponse.json({
				success: true,
				message: "Income proof uploaded and analyzed",
				url: uploadResult.url,
				fileName: uploadResult.fileName,
				extractedData: result,
			})
		} catch (err) {
			console.error("[v0] Income proof processing failed:", err)
			return NextResponse.json(
				{ error: "Failed to process income proof", errorCode: "PROCESSING_FAILED", details: err.message },
				{ status: 500 },
			)
		}
	} catch (error) {
		console.error("[v0] Income proof upload error:", error)
		return NextResponse.json(
			{ error: "Upload failed", errorCode: "GENERAL_ERROR", details: error.message },
			{ status: 500 },
		)
	}
}

// POST-only endpoint. Upload FormData with key: file

