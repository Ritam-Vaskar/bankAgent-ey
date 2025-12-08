import { GoogleGenerativeAI } from "@google/generative-ai"

let genAI

console.log("GOOGLE_AI_API_KEY:", process.env.GEMINI_API_KEY)
function getGenAI() {
  console.log("Inside getGenAI function")
  console.log("id is ", process.env.GEMINI_API_KEY)
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
   console.log("GENAI INSTANCE:", genAI)
  return genAI
 
}

export async function callGemini(prompt, systemPrompt, tools) {
  console.log("Calling Gemini with prompt:", prompt)
  
  const genAI = getGenAI()
  console.log("GENAI INSIDE CALLGEMINI:", genAI)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    tools: tools ? [{ functionDeclarations: tools }] : undefined,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
    ],
  })

  try {
    const response = await model.generateContent(prompt)
    const text = response.response.text()
    console.log("[v0] Gemini response:", text)
    return text
  } catch (error) {
    console.error("[v0] Gemini error:", error)
    throw error
  }
}

export function createToolDefinition(name, description, params) {
  return {
    name,
    description,
    parameters: {
      type: "object",
      properties: params,
      required: Object.keys(params),
    },
  }
}
