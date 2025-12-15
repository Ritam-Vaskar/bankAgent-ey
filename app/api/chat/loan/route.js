import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini-client";
export async function POST(req) {
  try {
    const { message, userId, flow } = await req.json();

    // Simulate Gemini API interaction
    const geminiResponse = await fetch("https://geminiapi.example.com/check-service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        flow,
        message,
      }),
    });

    const geminiData = await geminiResponse.json();

    if (geminiResponse.ok) {
      if (geminiData.serviceAvailable) {
        return NextResponse.json({
          message: `The ${flow} service is available. Redirecting you now...`,
          action: "redirect",
          url: geminiData.redirectUrl,
        });
      } else {
        return NextResponse.json({
          message: `Sorry, the ${flow} service is not available at the moment.`,
          action: "none",
        });
      }
    } else {
      return NextResponse.json({
        message: "An error occurred while checking the service. Please try again later.",
        action: "none",
      });
    }
  } catch (error) {
    console.error("Error in loan route:", error);
    return NextResponse.json({
      message: "An internal server error occurred. Please try again later.",
      action: "none",
    });
  }
}