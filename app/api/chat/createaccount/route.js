// app/api/chat/createaccount/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { auth } from "@/auth";
import { useSession, signIn } from "next-auth/react"
import CreateaccountChat from "@/models/CreateaccountChat";
import CreateaccountMessage from "@/models/CreateaccountMessage";
import CreateUserAccount from "@/models/CreateUserAccount";

export async function POST(req,userId) {
  try {

    const { userId, chatId, message, fileUrl, seqno } = await req.json();

    // Reuse existing chat or create new one
    let chat = chatId
      ? await CreateaccountChat.findById(chatId)
      : await CreateaccountChat.findOne({ userId });

    if (!chat) chat = await CreateaccountChat.create({ userId });

    // save user message
    if (message || fileUrl) {

        //here use callback to save message
        //and if successfully saved move to the next question in the flow

      await CreateaccountMessage.create({
        chatId: chat._id,
        userId,
        sender: "user",
        message: message || "📎 Document Uploaded",
        fileUrl: fileUrl || null,
      });
    }

    // Get form for this specific chat
    let form = await CreateUserAccount.findOne({ chatId: chat._id });

    if (!form) {
      form = await CreateUserAccount.create({
        chatId: chat._id,
        status: "initiated",
      });
    }

    let reply = { message: "", action: "continue" };

    // === Conversation Steps Handling ===
    if (!form.name) {
      if (!message) reply.message = "Please enter your name:";
      else {
        form.name = message;
        await form.save();
        reply.message = "Enter phone number:";
      }
    } else if (!form.phone) {
      if (!message) reply.message = "Enter phone number:";
      else {
        form.phone = message;
        await form.save();
        reply.message = "Enter your email:";
      }
    } else if (!form.email) {
      if (!message) reply.message = "Enter email:";
      else {
        form.email = message;
        await form.save();
        reply.message = "Enter your address:";
      }
    } else if (!form.address) {
      if (!message) reply.message = "Enter address:";
      else {
        form.address = message;
        await form.save();
        reply.message = "Upload Aadhaar document";
        reply.action = "request_upload";
        reply.docType = "aadhaar";
      }
    } else if (!form.aadharPhotoUrl) {
      if (!fileUrl) {
        reply.message = "Upload Aadhaar document";
        reply.action = "request_upload";
        reply.docType = "aadhaar";
      } else {
        form.aadharPhotoUrl = fileUrl;
        await form.save();
        reply.message = "Upload PAN document";
        reply.action = "request_upload";
        reply.docType = "pan";
      }
    } else if (!form.panPhotoUrl) {
      if (!fileUrl) {
        reply.message = "Upload PAN document";
        reply.action = "request_upload";
        reply.docType = "pan";
      } else {
        form.panPhotoUrl = fileUrl;
        form.status = "completed";
        form.accountNumber = "AC" + Date.now();
        await form.save();

        reply.message = `🎉 Account Created!\nAccount Number: ${form.accountNumber}`;
        reply.action = "complete";
      }
    }

    // save bot response in chat
    await CreateaccountMessage.create({
      chatId: chat._id,
      userId,
      sender: "bot",
      message: reply.message,
    });

    return NextResponse.json({
      chatId: chat._id.toString(),
      ...reply,
    });

  } catch (err) {
    console.error("Chat createaccount error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
