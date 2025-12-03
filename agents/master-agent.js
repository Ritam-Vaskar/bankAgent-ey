import { callGemini, createToolDefinition } from "@/lib/gemini-client"
import connectDB from "@/lib/mongodb"
import Onboarding from "@/models/Onboarding"
import { validateName, validateDOB, validatePhone, validateAddress } from "@/lib/validators"

const MASTER_SYSTEM_PROMPT = `You are MasterAgent, an AI responsible for guiding users through BANK ACCOUNT CREATION through a conversational form.

You MUST:
1. Validate every field strictly.
2. If invalid → explain the error & ask again.
3. Guide step-by-step.
4. Store each valid answer into the system using provided functions.
5. After collecting personal details → ask Aadhaar & PAN upload.
6. Wait for document verification.
7. If verified → confirm account creation.
8. Return a confirmation message with account number.

Use short, friendly banking tone.
Never continue if previous step invalid.
Never skip steps.

Current step tracking:
- name: collect and validate full name
- dob: collect and validate date of birth (must be 18+)
- phone: collect and validate 10-digit phone
- address: collect and validate address
- aadhaar: request Aadhaar upload
- pan: request PAN upload
- verification: wait for KYC verification
- final: create account and return details`

const tools = [
  createToolDefinition("saveField", "Save a validated field to the onboarding record", {
    field: { type: "string", description: "Field name (fullName, dob, phone, address, etc)" },
    value: { type: "string", description: "Field value" },
  }),
  createToolDefinition("requestDocumentUpload", "Request user to upload a document", {
    docType: { type: "string", enum: ["aadhaar", "pan"], description: "Document type" },
  }),
  createToolDefinition("updateOnboardingStatus", "Update the onboarding status and step", {
    status: { type: "string", description: "Status: PERSONAL_PENDING, KYC_PENDING, VERIFIED, MCP_CREATED, COMPLETED" },
    step: { type: "string", description: "Current step: name, dob, phone, address, aadhaar, pan, verification, final" },
  }),
  createToolDefinition("sendMessageToFrontend", "Send a message to display to the user", {
    message: { type: "string", description: "Message to send" },
    action: { type: "string", enum: ["continue", "request_upload", "complete"], description: "Action for frontend" },
  }),
]

export async function processMasterAgentMessage(userMessage, userId) {
  try {
    await connectDB()

    let onboarding = await Onboarding.findOne({ userId })
    if (!onboarding) {
      onboarding = new Onboarding({ userId })
      await onboarding.save()
    }

    const context = `
Current Onboarding Status: ${onboarding.status}
Current Step: ${onboarding.step}
Collected Data: ${JSON.stringify(onboarding.data)}

User Message: "${userMessage}"

Perform validation and determine next step. If user input is valid for current step, save it. If invalid, ask again.
${onboarding.step === "name" ? "User should provide their full name (letters only, no numbers)." : ""}
${onboarding.step === "dob" ? "User should provide DOB in YYYY-MM-DD format. User must be 18+ years old." : ""}
${onboarding.step === "phone" ? "User should provide 10-digit Indian phone number." : ""}
${onboarding.step === "address" ? "User should provide their address (minimum 10 characters)." : ""}
${onboarding.step === "aadhaar" ? "User is uploading Aadhaar document." : ""}
${onboarding.step === "pan" ? "User is uploading PAN document." : ""}
`

    const response = await callGemini(context, MASTER_SYSTEM_PROMPT, tools)

    // Parse response and extract actions
    let agentAction = "continue"
    let responseMessage = response
    let nextStep = onboarding.step

    // Simple parsing of tool calls from response
    if (response.includes("saveField")) {
      // Validate and save based on current step
      if (onboarding.step === "name") {
        if (validateName(userMessage)) {
          onboarding.data.fullName = userMessage
          nextStep = "dob"
          responseMessage = "Thank you! Now, please provide your date of birth (YYYY-MM-DD format):"
        } else {
          responseMessage =
            "The input you provided seems incorrect. Please enter a valid full name (letters only, no numbers)."
        }
      } else if (onboarding.step === "dob") {
        if (validateDOB(userMessage)) {
          onboarding.data.dob = userMessage
          nextStep = "phone"
          responseMessage = "Great! Now, please provide your 10-digit phone number:"
        } else {
          responseMessage =
            "The input you provided seems incorrect. Please enter a valid date of birth (YYYY-MM-DD) and be at least 18 years old."
        }
      } else if (onboarding.step === "phone") {
        if (validatePhone(userMessage)) {
          onboarding.data.phone = userMessage
          nextStep = "address"
          responseMessage = "Perfect! Now, please provide your address (minimum 10 characters):"
        } else {
          responseMessage = "The input you provided seems incorrect. Please enter a valid 10-digit Indian phone number."
        }
      } else if (onboarding.step === "address") {
        if (validateAddress(userMessage)) {
          onboarding.data.address = userMessage
          nextStep = "aadhaar"
          responseMessage = "Excellent! Now I need your Aadhaar document. Please upload your Aadhaar (PDF or XML):"
          agentAction = "request_upload"
        } else {
          responseMessage =
            "The input you provided seems incorrect. Please enter a valid address (minimum 10 characters)."
        }
      }
    }

    // Update onboarding record
    onboarding.step = nextStep
    if (nextStep === "aadhaar" || nextStep === "pan") {
      onboarding.status = "KYC_PENDING"
    } else if (nextStep !== "final") {
      onboarding.status = "PERSONAL_PENDING"
    }

    await onboarding.save()

    return {
      message: responseMessage,
      action: agentAction,
      docType: agentAction === "request_upload" ? nextStep : null,
    }
  } catch (error) {
    console.error("[v0] Master agent error:", error)
    throw error
  }
}
