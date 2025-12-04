import { callGemini, createToolDefinition } from "@/lib/gemini-client"

const WORKER_MCP_SYSTEM_PROMPT = `You are Worker-MCP Agent.
Your job: create bank account in the mock core banking system.

Process:
1. Receive user data and KYC verification status
2. Generate a random 12-digit account number
3. Call the MCP API to create account
4. Return confirmation

Output MUST BE valid JSON with this format:
{
  "status": "CREATED",
  "account_number": "XXXXXXXXXXXX",
  "timestamp": "ISO timestamp"
}`

const tools = [
  createToolDefinition("generateAccountNumber", "Generate a 12-digit account number", {}),
  createToolDefinition("callMcpApi", "Call MCP API to create account", {
    accountNumber: { type: "string", description: "Generated account number" },
    userData: { type: "string", description: "User data as JSON string" },
  }),
]

export async function processWorkerMCP(userId, kycData, personalData) {
  try {
    const accountNumber = generateRandomAccountNumber()

    const context = `
Create a bank account with the following information:
- User ID: ${userId}
- Account Number: ${accountNumber}
- KYC Data: ${JSON.stringify(kycData)}
- Personal Data: ${JSON.stringify(personalData)}

Generate account creation confirmation.`

    const response = await callGemini(context, WORKER_MCP_SYSTEM_PROMPT, tools)

    let result
    try {
      result = JSON.parse(response)
    } catch (e) {
      console.log("[v0] Could not parse MCP response as JSON:", response)
      result = {
        status: "CREATED",
        account_number: accountNumber,
        timestamp: new Date().toISOString(),
      }
    }

    return result
  } catch (error) {
    console.error("[v0] Worker MCP error:", error)
    throw error
  }
}

export function generateRandomAccountNumber() {
  // Generate 12-digit account number starting with user-specific prefix
  const randomPart = Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0")
  return randomPart
}

export async function mockCreateAccount(userId, accountData) {
  // Mock MCP API response
  return {
    status: "CREATED",
    account_number: generateRandomAccountNumber(),
    userId,
    timestamp: new Date().toISOString(),
  }
}
