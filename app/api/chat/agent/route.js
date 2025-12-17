
import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini-client";
import connectDB from "@/lib/mongodb";
import Account from "@/models/Account";

export async function POST(req) {
  try {
    const { input, userId } = await req.json();

    // Check if user has an account
    await connectDB();
    const existingAccount = await Account.findOne({ userId });
    const hasAccount = !!existingAccount;

    const SystemgeneratedPrompt = `You are an intelligent banking assistant. Analyze the user's request and determine what service they need.

Available Services:
1. Create Account - For opening new bank accounts
2. Loan Service - For loan applications and inquiries
3. Credit Card Service - For credit card applications
4. General Chat - For other banking questions

User Account Status: ${hasAccount ? "HAS ACCOUNT" : "NO ACCOUNT"}

IMPORTANT RULES:
- If user wants Loan or Credit Card but HAS NO ACCOUNT, respond with: "NEED_ACCOUNT_FIRST|loan" or "NEED_ACCOUNT_FIRST|creditcard"
- If user wants to Create Account but ALREADY HAS ACCOUNT, respond with: "ACCOUNT_EXISTS"
- If user wants Loan Service and HAS ACCOUNT, respond with: "/api/chat/loan"
- If user wants Credit Card and HAS ACCOUNT, respond with: "/api/chat/creditcard"
- If user wants to Create Account and NO ACCOUNT, respond with: "/api/chat/account"
- If general question or greeting, respond with: "CHAT" followed by a friendly response

User Input: "${input}"

Respond with ONLY one of these formats:
- /api/chat/loan
- /api/chat/creditcard
- /api/chat/account
- NEED_ACCOUNT_FIRST|loan
- NEED_ACCOUNT_FIRST|creditcard
- ACCOUNT_EXISTS
- CHAT|Your friendly response here`;

    let response;
    try {
      response = await callGemini(input, SystemgeneratedPrompt);
      console.log("Gemini response:", response);
    } catch (geminiError) {
      console.error("Gemini API error, using fallback:", geminiError.message);
      
      // Fallback: Simple keyword matching when Gemini fails
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('account') && lowerInput.includes('creat')) {
        response = hasAccount ? "ACCOUNT_EXISTS" : "/api/chat/account";
      } else if (lowerInput.includes('loan')) {
        response = hasAccount ? "/api/chat/loan" : "NEED_ACCOUNT_FIRST|loan";
      } else if (lowerInput.includes('credit') || lowerInput.includes('card')) {
        response = hasAccount ? "/api/chat/creditcard" : "NEED_ACCOUNT_FIRST|creditcard";
      } else {
        response = "CHAT|Hello! I can help you with creating an account, applying for loans, or getting a credit card. What would you like to do?";
      }
    }

    return NextResponse.json({ 
      message: response, 
      action: "none",
      hasAccount 
    });
  } catch (error) {
    console.error("Error in agent route:", error);
    return NextResponse.json({
      message: "CHAT|I'm here to help! You can ask me about creating an account, applying for a loan, or getting a credit card.",
      action: "none",
    });
  }
}
