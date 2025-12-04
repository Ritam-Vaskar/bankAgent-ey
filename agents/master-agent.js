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

    console.log("[v0] Processing step:", onboarding.step, "Message:", userMessage)

    let agentAction = "continue"
    let responseMessage = ""
    let nextStep = onboarding.step

    // Direct validation logic for each step
    if (onboarding.step === "name") {
      if (validateName(userMessage)) {
        onboarding.data.fullName = userMessage
        nextStep = "dob"
        responseMessage = "✅ Thank you! Now, please provide your date of birth in YYYY-MM-DD format (e.g., 1995-06-15):"
      } else {
        responseMessage =
          "⚠️ The input you provided seems incorrect. Please enter a valid full name (letters and spaces only, no numbers)."
      }
    } else if (onboarding.step === "dob") {
      if (validateDOB(userMessage)) {
        onboarding.data.dob = userMessage
        nextStep = "phone"
        responseMessage = "✅ Great! Now, please provide your 10-digit phone number:"
      } else {
        responseMessage =
          "⚠️ The input you provided seems incorrect. Please enter a valid date of birth in YYYY-MM-DD format. You must be at least 18 years old."
      }
    } else if (onboarding.step === "phone") {
      if (validatePhone(userMessage)) {
        onboarding.data.phone = userMessage
        nextStep = "address"
        responseMessage = "✅ Perfect! Now, please provide your complete address (minimum 10 characters):"
      } else {
        responseMessage =
          "⚠️ The input you provided seems incorrect. Please enter a valid 10-digit Indian phone number starting with 6-9."
      }
    } else if (onboarding.step === "address") {
      if (validateAddress(userMessage)) {
        onboarding.data.address = userMessage
        nextStep = "aadhaar"
        responseMessage = "✅ Excellent! Now I need your Aadhaar document. Please upload your Aadhaar (PDF or XML format):"
        agentAction = "request_upload"
      } else {
        responseMessage =
          "⚠️ The input you provided seems incorrect. Please enter a valid address with at least 10 characters."
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

    console.log("[v0] Updated to step:", nextStep, "Status:", onboarding.status)

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
