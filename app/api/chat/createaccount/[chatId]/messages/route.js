import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import CreateaccountChat from "@/models/CreateaccountChat"
import CreateaccountMessage from "@/models/CreateaccountMessage"
import CreateUserAccount from "@/models/CreateUserAccount"
import { checkGemini, analyzeImageWithGemini } from "@/lib/gemini-client"

const steps = [
	{ key: "name", prompt: "Please enter your name:", file: false, validation: null },
	{ key: "phone", prompt: "Enter your phone number:", file: false, validation: "phone" },
	{ key: "email", prompt: "Enter your email:", file: false, validation: "email" },
	{ key: "address", prompt: "Enter your address:", file: false, validation: null },
	{ key: "aadharUrl", prompt: "Please upload your Aadhaar card:", file: true, validation: null },
	{ key: "panUrl", prompt: "Please upload your PAN card:", file: true, validation: null },
]

async function validateInput(content, validationType) {
	if (!validationType) return { valid: true, content }
	
	const prompt = `Validate the following user input as a ${validationType}.
If it's a valid ${validationType}, respond with JSON: {"valid": true, "content": "${content}"}
If it's invalid, respond with JSON: {"valid": false, "content": "Error message explaining what's wrong"}
Do not provide any other text.`
	
	try {
		const response = await checkGemini(content, prompt)
		return response
	} catch (error) {
		console.error("Validation error:", error)
		// If Gemini is down/overloaded, skip validation and allow input
		console.log("Skipping validation due to Gemini error, allowing input")
		return { valid: true, content }
	}
}

async function extractDocumentNumber(imageUrl, documentType) {
	try {
		const prompt = documentType === "aadhaar" 
			? "Extract the 12-digit Aadhaar number from this document. Return only the number with spaces (e.g., '1234 5678 9012')."
			: "Extract the 10-character PAN number from this document. Return only the PAN number (e.g., 'ABCDE1234F')."
		
		// Fetch the image from URL
		const response = await fetch(imageUrl)
		if (!response.ok) {
			throw new Error(`Failed to fetch document: ${response.statusText}`)
		}
		
		const arrayBuffer = await response.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)
		
		// Determine mime type from URL
		const mimeType = imageUrl.toLowerCase().endsWith('.pdf') 
			? 'application/pdf' 
			: 'image/jpeg'
		
		const result = await analyzeImageWithGemini(buffer, mimeType, prompt)
		
		// Clean up the extracted number
		const cleanedNumber = result.trim().replace(/[^A-Z0-9\s]/g, '')
		console.log(`Extracted ${documentType} number:`, cleanedNumber)
		
		return cleanedNumber || "NOT_EXTRACTED"
	} catch (error) {
		console.error(`Error extracting ${documentType} number:`, error)
		return "NOT_EXTRACTED"
	}
}

// Get all messages for a specific create account chat
export async function GET(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		// Verify chat belongs to user
		const chat = await CreateaccountChat.findOne({
			_id: chatId,
			userId: session.user.id,
		})

		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		const messages = await CreateaccountMessage.find({ chatId })
			.sort({ createdAt: 1 })
			.lean()

		return NextResponse.json({ messages })
	} catch (error) {
		console.error("Error fetching create account messages:", error)
		return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
	}
}

// Send a new message to create account chat
export async function POST(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { message, sender = "user", stepIndex = 0 } = await req.json()

		if (!message) {
			return NextResponse.json({ error: "Message is required" }, { status: 400 })
		}

		await connectDB()

		// Verify chat belongs to user
		const chat = await CreateaccountChat.findOne({
			_id: chatId,
			userId: session.user.id,
		})

		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		// If it's a bot message, just save it
		if (sender === "bot") {
			const botMessage = await CreateaccountMessage.create({
				chatId,
				sender: "bot",
				message,
			})
			await CreateaccountChat.findByIdAndUpdate(chatId, { updatedAt: new Date() })
			return NextResponse.json({ message: botMessage })
		}

		// User message - validate if needed
		const currentStep = steps[stepIndex]
		if (currentStep && currentStep.validation) {
			const validation = await validateInput(message, currentStep.validation)
			if (!validation.valid) {
				return NextResponse.json({ error: validation.content }, { status: 400 })
			}
		}

		// Save user message
		const userMessage = await CreateaccountMessage.create({
			chatId,
			sender: "user",
			message,
		})

		// Update chat timestamp
		await CreateaccountChat.findByIdAndUpdate(chatId, { updatedAt: new Date() })

		// Check if we need to proceed to next step or create account
		const nextStepIndex = stepIndex + 1
		
		if (nextStepIndex >= steps.length) {
			// All steps complete - create account
			const allMessages = await CreateaccountMessage.find({ chatId })
				.sort({ createdAt: 1 })
				.lean()
			
			const userMessages = allMessages.filter(m => m.sender === "user")
			
			if (userMessages.length === steps.length) {
				try {
					// Extract document numbers from uploaded images
					const aadharPhotoUrl = userMessages[4].message
					const panPhotoUrl = userMessages[5].message
					
					console.log("Extracting Aadhaar number from:", aadharPhotoUrl)
					const aadharNo = await extractDocumentNumber(aadharPhotoUrl, "aadhaar")
					
					console.log("Extracting PAN number from:", panPhotoUrl)
					const panNo = await extractDocumentNumber(panPhotoUrl, "pan")
					
					const accountData = {
						userId: session.user.id,
						name: userMessages[0].message,
						phone: userMessages[1].message,
						email: userMessages[2].message,
						address: userMessages[3].message,
						aadharPhotoUrl,
						aadharNo,
						panPhotoUrl,
						panNo,
						AccountNumber: chatId,
					}

					console.log("Creating account with data:", accountData)
					const newAccount = await CreateUserAccount.create(accountData)
					await CreateaccountChat.findByIdAndUpdate(chatId, { isOpened: false })

					const botResponse = await CreateaccountMessage.create({
						chatId,
						sender: "bot",
						message: `✓ Account created successfully!\nYour account number is: ${newAccount.AccountNumber}\n\nThank you for completing the registration process.`,
					})

					return NextResponse.json({ userMessage, botResponse })
				} catch (error) {
					console.error("Account creation error:", error)
					const errorMessage = await CreateaccountMessage.create({
						chatId,
						sender: "bot",
						message: "Sorry, there was an error creating your account. Please contact support.",
					})
					return NextResponse.json({ userMessage, botResponse: errorMessage })
				}
			}
		}

		// Send next question
		const nextStep = steps[nextStepIndex]
		if (nextStep) {
			const botResponse = await CreateaccountMessage.create({
				chatId,
				sender: "bot",
				message: nextStep.prompt,
			})
			return NextResponse.json({ userMessage, botResponse })
		}

		return NextResponse.json({ userMessage })
	} catch (error) {
		console.error("Error sending message:", error)
		return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	}
}
