// app/api/chat/createaccount/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

// NOTE: Removed unnecessary client-side import: 'next-auth/react'
import CreateaccountChat from "@/models/CreateaccountChat";
import CreateaccountMessage from "@/models/CreateaccountMessage";
import CreateUserAccount from "@/models/CreateUserAccount";

// Establish DB connection once (best practice, though not strictly required here)
// Note: Depending on your 'connectDB' implementation, you might want to call it once
// at the start of your handler or trust the connection is handled by your lib/mongodb.

export async function POST(req) {
    // 1. All body data is read and destructured in one go (CORRECTED)
    const body = await req.json();
    const { 
        newchat, saveMessage, createNewAccount, getchat, userId, content, sender, chatId,
        name, phone, email, aadharPhotoUrl, aadharNo, panPhotoUrl, panNo, role,
        address, AccountNumber,
    } = body;
    
    // --- Get Specific Chat ---
    if (getchat) {
        try {
            await connectDB();
            console.log("Fetching account chat:", chatId);
            
            // Fetch chat details and messages
            const chat = await CreateaccountChat.findById(chatId);
            if (!chat) {
                return NextResponse.json({ error: "Chat not found" }, { status: 404 });
            }
            
            const messages = await CreateaccountMessage.find({ chatId });
            console.log("Found", messages.length, "messages for chat", chatId);
            
            return NextResponse.json({ 
                chat: {
                    _id: chat._id,
                    userId: chat.userId,
                    isOpened: chat.isOpened,
                    createdAt: chat.createdAt,
                },
                messages: messages 
            });
        } catch (error) {
            console.error("Error fetching account chat:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
    
    // --- New Chat Creation ---
    else if (newchat) {
        try {
            // It's a good practice to ensure the DB connection is ready
            await connectDB(); 
            console.log("Inside new chat");
            const chat = new CreateaccountChat({ userId ,isOpened: true });
            await chat.save();
            return NextResponse.json({ chatId: chat._id });
        } catch (e) {
            console.log("Error is :" + e);
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }
    
    // --- Message Saving ---
    else if (saveMessage) {
        try {
            await connectDB(); 
            console.log("the informations are " + chatId + " " + role + " ");
            console.log("the content is :- "+content);
            const newMessage = new CreateaccountMessage({
                chatId,
                sender:role,
                message: content,
            
            });
        
            await newMessage.save();
            return NextResponse.json({ data: "Message Successfully Saved" }, { status: 200 });
        } catch (e) {
            console.log("error in message saving :- " + e);
            // Note: Use return here, not await
            return NextResponse.json({ error: e.message }, { status: 500 }); 
        }
    }
    
    // --- Account Creation ---
    else if (createNewAccount) {
        try {
            await connectDB(); 
            const newAccount = new CreateUserAccount({ // Added 'new' keyword
                name, phone, email, aadharPhotoUrl, aadharNo, panPhotoUrl, panNo, 
                address
            });
            newAccount.AccountNumber = chatId;
            await newAccount.save();
            //find an unique account Number 

            
            // 2. FIX: Corrected findByIdAndUpdate syntax 
            await CreateaccountChat.findByIdAndUpdate(chatId, { isOpened: false });
            
            return NextResponse.json({ data: "Successfully Closed The Chat And Saved The Account Info in database" , accountNumber: newAccount.AccountNumber}, { status: 200 });
        } catch (err) {
            console.error("Chat createaccount error:", err);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    } 
    
    // --- Default Response (Improvement) ---
    return NextResponse.json({ error: "Invalid action specified in request body" }, { status: 400 });
}

// --------------------------------------------------------------------------------

export async function GET(req) {
    // 3. FIX: Correctly access query parameters from the URL
    const userId = req.nextUrl.searchParams.get("userId");
    const chatId = req.nextUrl.searchParams.get("chatId");
    console.log("userId:", userId, "chatId:", chatId);

    try {
        await connectDB();
        
        if (!chatId) {
            // Fetch all chats for a specific user
            const allChat = await CreateaccountChat.find({ userId });
            // send all chat As name of the chat
            //send chatname as well as chatid
            console.log("allChat:", allChat);
            const chatName = allChat.map((chat) => ({
                chatId: chat._id,
                
            }));
            return NextResponse.json({ chatName });
        } else if (chatId) {
            // Fetch messages for a specific chat
            // You might want to get the chat details using _id, but chatId for messages is fine
            const allChat = await CreateaccountChat.find({ _id: chatId }); 
            const Allmessages = await CreateaccountMessage.find({ chatId });
            console.log("All messages are :- ", Allmessages);
            return NextResponse.json({ Allmessages });
        } else {
            // Handle case where neither parameter is provided (Improvement)
            return NextResponse.json({ error: "Missing 'userId' or 'chatId' query parameter" }, { status: 400 });
        }
    } catch (error) {
        console.error("Chat Fetching error:", error);
        return NextResponse.json({ error: "Failed to fetch chat data" }, { status: 500 });
    }
}