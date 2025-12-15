
import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini-client";

export async function  POST(req) {
  try {
    const {input , userId } = await req.json();
      const SystemgeneratedPrompt = `You Are Decision Maker Agent. Based On User Input Take Decision which service 
        the user is looking for. The Options are: 
        1. Loan Service
        2. Create Account
        3. Credit Card Service
        4. None
        And based on this Service Redirect User to Relevant Service URL.
        for Service URLs refer below:
        Loan Service URL: /api/chat/loan
        Create Account URL: /api/chat/account
        Credit Card Service URL: /api/chat/creditcard
        if Node  URL : None
        Provide only URL in response. Do not provide any other text.
        `;
      const response = await callGemini(input, SystemgeneratedPrompt);
      const res = response;
      console.log("Gemini response:", res);
      
      return NextResponse.json({ message: res, action: "none" });
  }
  catch (error) {
    console.error("Error in agent route:", error);
    return NextResponse.json({
      message: "An internal server error occurred. Please try again later.",
      action: "none",
    });
  }
}
