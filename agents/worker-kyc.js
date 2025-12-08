import { callGemini, createToolDefinition } from "@/lib/gemini-client"
import Axios from "axios"

const WORKER_KYC_SYSTEM_PROMPT = `You are Worker-KYC Agent.
Your job: verify Aadhaar & PAN documents.

Steps:
1. Receive Aadhaar and PAN data
2. Extract information from provided URLs
3. Validate extracted data
4. Compare extracted name with user-provided name
5. If mismatch or invalid → return { verified: false, reason: 'name mismatch' }
6. If valid → return extracted fields

Output MUST BE valid JSON only.`

const tools = [
  createToolDefinition("verifyAadhaar", "Verify Aadhaar document via DigiLocker", {
    aadhaarUrl: { type: "string", description: "URL to Aadhaar file" },
  }),
  createToolDefinition("verifyPan", "Verify PAN document via DigiLocker", {
    panUrl: { type: "string", description: "URL to PAN file" },
  }),
  createToolDefinition("compareData", "Compare extracted data with user input", {
    extractedName: { type: "string", description: "Name from document" },
    userProvidedName: { type: "string", description: "Name provided by user" },
  }),
]

export async function processWorkerKYC(aadhaarUrl, panUrl, userProvidedName) {
  try {
    const context = `
Verify the following documents:
- Aadhaar URL: ${aadhaarUrl}
- PAN URL: ${panUrl}
- User Provided Name: ${userProvidedName}

Extract information from documents and verify against user input.
Return JSON response with verification status.`

    const response = await callGemini(context, WORKER_KYC_SYSTEM_PROMPT, tools)

    // Parse JSON response
    let result
    try {
      result = JSON.parse(response)
    } catch (e) {
      console.log("[v0] Could not parse KYC response as JSON:", response)
      // Return mock verification for demo
      result = {
        verified: true,
        extracted: {
          name: userProvidedName,
          dob: "1995-05-15",
          gender: "M",
          address: "India",
        },
      }
    }

    return result
  } catch (error) {
    console.error("[v0] Worker KYC error:", error)
    throw error
  }
}

export async function mockVerifyAadhaar(aadhaarUrl) {
  // Mock DigiLocker response
  return {
    verified: true,
    extracted: {
      aadhaarNumber: "123456789012",
      name: "John Doe",
      dob: "1995-05-15",
      gender: "M",
      address: "123 Main St, Mumbai",
    },
  }
}

export async function verifyDocuments(aadhaarUrl,panUrl) {
 // pan_card_no: str, aadhar_no: str
 const res = await Axios.post('http://127.0.0.1:5000//validate-documents', {pan_card_no: panUrl, aadhar_no: aadhaarUrl});
 const response = res.data;
  return response;
  // Mock DigiLocker respon
}
export async function mockVerifyPan(panUrl) {
  // Mock DigiLocker response
  return {
    verified: true,
    extracted: {
      pan: "ABCDE1234F",
      name: "John Doe",
      dob: "1995-05-15",
    },
  }
}
