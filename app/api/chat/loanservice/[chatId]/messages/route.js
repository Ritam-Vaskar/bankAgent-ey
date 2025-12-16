import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import connectDB from "@/lib/mongodb"
import LoanChat from "@/models/LoanChat"
import LoanMessage from "@/models/LoanMessage"
import CreateUserAccount from "@/models/CreateuserAccount"
import LoanApplication from "@/models/LoanApplication"

const loanSteps = [
	{ key: "confirmDetails", prompt: "confirm", file: false, validation: "yesno" },
	{ key: "incomeProof", prompt: "Please upload your income proof (Salary Slip/ITR/GST Return):", file: true },
	{ key: "selectLoan", prompt: "select", file: false },
]

// Get all messages for a specific loan chat
export async function GET(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		await connectDB()

		// Verify chat belongs to user
		const chat = await LoanChat.findOne({
			_id: chatId,
			userId: session.user.id,
		})

		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		const messages = await LoanMessage.find({ chatId })
			.sort({ createdAt: 1 })
			.lean()

		return NextResponse.json({ messages })
	} catch (error) {
		console.error("Error fetching loan messages:", error)
		return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
	}
}

// Send a new message to loan chat
export async function POST(req, { params }) {
	try {
		const { chatId } = await params
		const session = await getServerSession(authOptions)
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const userId = session.user.id
		const { message, fileUrl } = await req.json()

		if (!message && !fileUrl) {
			return NextResponse.json({ error: "Message or file is required" }, { status: 400 })
		}

		await connectDB()

		// Verify chat belongs to user
		const chat = await LoanChat.findOne({ _id: chatId, userId })
		if (!chat) {
			return NextResponse.json({ error: "Chat not found" }, { status: 404 })
		}

		// Save user message
		const userMessage = await LoanMessage.create({
			chatId,
			sender: "user",
			message: message || "File uploaded",
			fileUrl: fileUrl || null,
		})

		// Check if user has an account
		const userAccount = await CreateUserAccount.findOne({ userId })
		if (!userAccount) {
			const botMessage = await LoanMessage.create({
				chatId,
				sender: "bot",
				message: "You need to create an account first before applying for a loan. Please visit the Create Account section to set up your account.",
			})
			return NextResponse.json({ userMessage, botMessage })
		}

		// Count user messages to determine step
		const userMessages = await LoanMessage.countDocuments({
			chatId,
			sender: "user",
		})
		const currentStep = userMessages - 1 // 0-indexed

		let botMessageText = ""

		// Step 0: Show user details and ask for confirmation
		if (currentStep === 0) {
			botMessageText = `I found your account details:\n\n` +
				`Name: ${userAccount.name}\n` +
				`PAN: ${userAccount.panNo || "N/A"}\n` +
				`Email: ${userAccount.email}\n` +
				`Phone: ${userAccount.phone}\n\n` +
				`Is this information correct? (yes/no)`
		}
		// Step 1: Handle confirmation and ask for income proof
		else if (currentStep === 1) {
			const response = message.toLowerCase().trim()
			if (response !== "yes" && response !== "y") {
				botMessageText = "Please update your account details first before applying for a loan. Visit the Create Account section."
			} else {
				botMessageText = "Great! Please upload your income proof document:\n- Salary Slip\n- ITR (Income Tax Return)\n- GST Return"
			}
		}
		// Step 2: Process income document and show bank balance
		else if (currentStep === 2) {
			if (!fileUrl) {
				botMessageText = "Please upload your income proof document."
			} else {
				try {
					// For now, ask user to input income manually since Gemini extraction is having issues
					// Store the file URL for future reference
					await LoanChat.findByIdAndUpdate(chatId, {
						$set: { incomeDocumentUrl: fileUrl }
					})

					botMessageText = "Thank you for uploading your income proof document. It has been saved.\n\n" +
						"Please type your monthly income amount (numbers only, e.g., 50000):"

				} catch (error) {
					console.error("Error processing income document:", error)
					botMessageText = "Unable to process income document. Please try uploading again or contact support."
				}
			}
		}
		// Step 3: Get income amount from user input
		else if (currentStep === 3) {
			try {
				// Parse income from user message
				const incomeInput = message.trim().replace(/[^0-9]/g, '')
				const extractedIncome = parseInt(incomeInput)

				if (!extractedIncome || extractedIncome <= 0) {
					botMessageText = "Please enter a valid monthly income amount (numbers only)."
				} else {
					// Store income in chat metadata
					await LoanChat.findByIdAndUpdate(chatId, {
						$set: { extractedIncome: String(extractedIncome) }
					})

					// Fetch bank balance
					const balanceResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/upload/Bank_details_check`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ pan: userAccount.panNo }),
					})

					if (!balanceResponse.ok) {
						throw new Error("Failed to fetch bank balance")
					}

					const balanceData = await balanceResponse.json()
					
					// Extract bank details from primaryAccount or first account
					const bankAccount = balanceData.primaryAccount || (balanceData.accounts && balanceData.accounts[0]) || {}
					
					botMessageText = `Income confirmed: ₹${extractedIncome.toLocaleString()}/month\n\n` +
						`Your Bank Details:\n` +
						`Account Number: ${bankAccount.accountNumber || "N/A"}\n` +
						`Balance: ₹${bankAccount.amount ? parseFloat(bankAccount.amount).toLocaleString() : "N/A"}\n` +
						`Bank Name: ${bankAccount.bankName || "N/A"}\n\n` +
						`Is this information correct? (yes/no)`
				}

			} catch (error) {
				console.error("Error processing income:", error)
				botMessageText = "Unable to process income. Please try again."
			}
		}
		// Step 4: Show loan history and available loans
		else if (currentStep === 4) {
			// Validate user confirmation
			const userResponse = message.trim().toLowerCase()
			
			if (userResponse !== "yes" && userResponse !== "no") {
				botMessageText = "Please reply with 'yes' to continue or 'no' to re-enter your information."
				return NextResponse.json({
					botMessage: botMessageText,
					stepIncremented: false
				})
			}
			
			if (userResponse === "no") {
				// Reset to step 2 to re-enter income
				await LoanChat.findByIdAndUpdate(chatId, {
					$set: { currentStep: 2 }
				})
				botMessageText = "No problem! Please upload your income document again or enter your monthly income."
				return NextResponse.json({
					botMessage: botMessageText,
					stepIncremented: false
				})
			}
			
			try {
				// Get stored income
				const currentChat = await LoanChat.findById(chatId)
				const extractedIncomeNum = parseFloat(currentChat.extractedIncome) || 0

				// Start building comprehensive summary
				botMessageText = `📋 Loan Application Summary\n`
				botMessageText += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
				botMessageText += `👤 Personal Information:\n`
				botMessageText += `   Name: ${userAccount.name}\n`
				botMessageText += `   PAN: ${userAccount.panNo || "N/A"}\n`
				botMessageText += `   Email: ${userAccount.email}\n`
				botMessageText += `   Phone: ${userAccount.phone}\n\n`

				botMessageText += `💰 Income Details:\n`
				botMessageText += `   Monthly Income: ₹${extractedIncomeNum.toLocaleString()}\n`
				botMessageText += `   Annual Income: ₹${(extractedIncomeNum * 12).toLocaleString()}\n\n`

				// Fetch bank balance
				const balanceResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/upload/Bank_details_check`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pan: userAccount.panNo }),
				})

				if (balanceResponse.ok) {
					const balanceData = await balanceResponse.json()
					const bankAccount = balanceData.primaryAccount || (balanceData.accounts && balanceData.accounts[0]) || {}
					botMessageText += `🏦 Bank Details:\n`
					botMessageText += `   Account Number: ${bankAccount.accountNumber || "N/A"}\n`
					botMessageText += `   Bank Name: ${bankAccount.bankName || "N/A"}\n`
					botMessageText += `   Current Balance: ₹${bankAccount.amount ? parseFloat(bankAccount.amount).toLocaleString() : "N/A"}\n\n`
				}

				// Fetch loan history
				const historyResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/upload/loan_background_check`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ pan: userAccount.panNo }),
				})

				let historyData = null
				if (historyResponse.ok) {
					historyData = await historyResponse.json()
				} else if (historyResponse.status === 404) {
					historyData = { loans: [] }
				} else {
					throw new Error("Failed to fetch loan history")
				}
				
				botMessageText += `📊 Previous Loan History:\n`
				if (historyData.loans && historyData.loans.length > 0) {
					historyData.loans.forEach((loan, index) => {
						botMessageText += `   ${index + 1}. ${loan.loanType || loan.loan_type || "N/A"}\n` +
							`      Amount: ₹${loan.loanAmount || loan.amount || "N/A"}\n` +
							`      Status: ${loan.currentStatus || loan.status || "N/A"}\n` +
							`      Monthly EMI: ₹${loan.monthlyEmi || loan.emi || "N/A"}\n`
					})
					botMessageText += `\n`
				} else {
					botMessageText += `   No previous loans found ✓\n\n`
				}

				botMessageText += `━━━━━━━━━━━━━━━━━━━━━━\n\n`

				// Fetch available loans
				const loansResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/upload/loan_details`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ 
						pan: userAccount.panNo,
						income: {
							monthlyNetSalary: extractedIncomeNum
						}
					}),
				})

				if (!loansResponse.ok) {
					throw new Error("Failed to fetch loan options")
				}

				const loansData = await loansResponse.json()
				
				botMessageText += `🎯 Available Loan Options for You:\n\n`
				
				const recommendations = loansData.recommendations || []
				if (recommendations.length > 0) {
					recommendations.forEach((loan, index) => {
						botMessageText += `${index + 1}. ${loan.type?.toUpperCase() || "N/A"} LOAN\n` +
							`   💵 Eligible Amount: ₹${Math.round(loan.eligibleAmount || 0).toLocaleString()}\n` +
							`   📈 Interest Rate: ${loan.annualInterestRate || "N/A"}%\n` +
							`   📅 Tenure: ${loan.tenureMonths || "N/A"} months\n` +
							`   💳 Estimated EMI: ₹${Math.round(loan.estimatedEmi || 0).toLocaleString()}/month\n\n`
					})

					// Store available loans in chat metadata
					await LoanChat.findByIdAndUpdate(chatId, {
						$set: { availableLoans: recommendations }
					})

					botMessageText += `━━━━━━━━━━━━━━━━━━━━━━\n`
					botMessageText += `Please reply with the loan number (1, 2, 3, etc.) to apply for that loan.`
				} else {
					botMessageText += `Sorry, no loan options are available for you at this time based on your profile.`
				}

			} catch (error) {
				console.error("Error fetching loan details:", error)
				botMessageText = "Unable to fetch loan options. Please try again later."
			}
		}
		// Step 5: Handle loan selection
		else if (currentStep === 5) {
			try {
				const currentChat = await LoanChat.findById(chatId)
				const selectedIndex = parseInt(message.trim()) - 1

				if (!currentChat.availableLoans || currentChat.availableLoans.length === 0) {
					botMessageText = "No loan options available. Please start the process again."
				} else if (selectedIndex < 0 || selectedIndex >= currentChat.availableLoans.length) {
					botMessageText = `Invalid selection. Please choose a number between 1 and ${currentChat.availableLoans.length}.`
				} else {
					const selectedLoan = currentChat.availableLoans[selectedIndex]
					
					// Get user account details
					const userAccount = await CreateUserAccount.findOne({ userId: session.user.id })
					
					// Create loan application in database
					const loanApplication = await LoanApplication.create({
						userId: session.user.id,
						panNo: userAccount.panNo,
						loanType: selectedLoan.type,
						eligibleAmount: selectedLoan.eligibleAmount,
						annualInterestRate: selectedLoan.annualInterestRate,
						tenureMonths: selectedLoan.tenureMonths,
						estimatedEmi: selectedLoan.estimatedEmi,
						monthlyIncome: parseFloat(currentChat.extractedIncome) || 0,
						applicationStatus: "pending",
					})
					
					// Store selected loan in chat
					await LoanChat.findByIdAndUpdate(chatId, {
						$set: { 
							selectedLoan: selectedLoan,
							loanStatus: "Applied"
						}
					})

					botMessageText = `✅ Loan Application Submitted!\n\n` +
						`Loan Type: ${selectedLoan.type || "N/A"} Loan\n` +
						`Eligible Amount: ₹${Math.round(selectedLoan.eligibleAmount || 0).toLocaleString()}\n` +
						`Interest Rate: ${selectedLoan.annualInterestRate || "N/A"}%\n` +
						`Tenure: ${selectedLoan.tenureMonths || "N/A"} months\n` +
						`Estimated EMI: ₹${Math.round(selectedLoan.estimatedEmi || 0).toLocaleString()}\n\n` +
						`Application ID: ${loanApplication._id}\n` +
						`Your loan application has been submitted for review. You will receive a confirmation shortly.`
				}
			} catch (error) {
				console.error("Error processing loan selection:", error)
				botMessageText = "Unable to process your loan selection. Please try again."
			}
		}
		// Additional messages after completion
		else {
			botMessageText = "Your loan application is complete. If you have any questions, please contact our support team."
		}

		const botMessage = await LoanMessage.create({
			chatId,
			sender: "bot",
			message: botMessageText,
		})

		return NextResponse.json({ userMessage, botMessage })
	} catch (error) {
		console.error("Error in loan messages:", error)
		return NextResponse.json(
			{ error: "Failed to process message" },
			{ status: 500 }
		)
	}
}
