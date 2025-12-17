"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Send, Bot, User, Plus, Trash2, MessageSquare, Upload } from "lucide-react"

export default function CreateAccountPage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [chats, setChats] = useState([])
	const [currentChatId, setCurrentChatId] = useState(null)
	const [messages, setMessages] = useState([])
	const [inputMessage, setInputMessage] = useState("")
	const [loading, setLoading] = useState(false)
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [stepIndex, setStepIndex] = useState(0)
	const [uploading, setUploading] = useState(false)
	const messagesEndRef = useRef(null)
	const fileInputRef = useRef(null)

	const steps = [
		{ key: "name", prompt: "Please enter your name:", file: false },
		{ key: "phone", prompt: "Enter your phone number:", file: false },
		{ key: "email", prompt: "Enter your email:", file: false },
		{ key: "address", prompt: "Enter your address:", file: false },
		{ key: "aadharUrl", prompt: "Please upload your Aadhaar card:", file: true },
		{ key: "panUrl", prompt: "Please upload your PAN card:", file: true },
	]

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login")
		}
	}, [status, router])

	// Load all chats on mount
	useEffect(() => {
		if (status === "authenticated") {
			loadChats()
		}
	}, [status])

	// Load messages when chat changes
	useEffect(() => {
		if (currentChatId) {
			loadMessages(currentChatId)
		} else {
			setMessages([])
			setStepIndex(0)
		}
	}, [currentChatId])

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const loadChats = async () => {
		try {
			const res = await fetch("/api/chat/createaccount")
			const data = await res.json()
			if (res.ok) {
				setChats(data.chats || [])
			}
		} catch (error) {
			console.error("Failed to load chats:", error)
		}
	}

	const loadMessages = async (chatId) => {
		try {
			const res = await fetch(`/api/chat/createaccount/${chatId}/messages`)
			const data = await res.json()
			if (res.ok) {
				const msgs = data.messages || []
				setMessages(msgs)
				
				// Calculate step index based on user messages
				const userMessages = msgs.filter(m => m.sender === "user")
				setStepIndex(userMessages.length)
				
				// If no messages, send first bot message
				if (msgs.length === 0) {
					sendBotMessage(chatId, steps[0].prompt)
				}
			}
		} catch (error) {
			console.error("Failed to load messages:", error)
		}
	}

	const sendBotMessage = async (chatId, content) => {
		try {
			const res = await fetch(`/api/chat/createaccount/${chatId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: content, sender: "bot" }),
			})
			const data = await res.json()
			if (res.ok && data.message) {
				setMessages(prev => [...prev, data.message])
			}
		} catch (error) {
			console.error("Failed to send bot message:", error)
		}
	}

	const handleNewChat = async () => {
		try {
			const res = await fetch("/api/chat/createaccount", {
				method: "POST",
			})
			const data = await res.json()
			if (res.ok) {
				setChats((prev) => [data.chat, ...prev])
				setCurrentChatId(data.chat._id)
				setMessages([])
				setStepIndex(0)
			}
		} catch (error) {
			console.error("Failed to create chat:", error)
		}
	}

	const handleDeleteChat = async (chatId, e) => {
		e.stopPropagation()
		if (!confirm("Delete this chat?")) return

		try {
			const res = await fetch(`/api/chat/createaccount/${chatId}`, {
				method: "DELETE",
			})
			if (res.ok) {
				setChats(prev => prev.filter(c => c._id !== chatId))
				if (currentChatId === chatId) {
					setCurrentChatId(null)
					setMessages([])
					setStepIndex(0)
				}
			}
		} catch (error) {
			console.error("Failed to delete chat:", error)
		}
	}

	const handleFileUpload = async (file) => {
		if (!file) return null

		setUploading(true)
		try {
			const formData = new FormData()
			formData.append("file", file)

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			})

			const data = await res.json()
			if (res.ok) {
				return data.url
			} else {
				alert("File upload failed")
				return null
			}
		} catch (error) {
			console.error("Upload error:", error)
			alert("File upload failed")
			return null
		} finally {
			setUploading(false)
		}
	}

	const handleSendMessage = async (e) => {
		e.preventDefault()
		if (!currentChatId) {
			alert("Please create a new chat first")
			return
		}

		const currentStep = steps[stepIndex]
		
		if (currentStep.file) {
			// File upload step
			const fileInput = fileInputRef.current
			if (!fileInput || !fileInput.files[0]) {
				alert("Please select a file")
				return
			}

			setLoading(true)
			const fileUrl = await handleFileUpload(fileInput.files[0])
			
			if (fileUrl) {
				await saveUserMessage(fileUrl)
				fileInput.value = ""
			}
			setLoading(false)
		} else {
			// Text input step
			if (!inputMessage.trim()) return

			const messageText = inputMessage.trim()
			setInputMessage("")
			setLoading(true)

			await saveUserMessage(messageText)
			setLoading(false)
		}
	}

	const saveUserMessage = async (content) => {
		try {
			const res = await fetch(`/api/chat/createaccount/${currentChatId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					message: content, 
					sender: "user",
					stepIndex 
				}),
			})

			const data = await res.json()
			if (res.ok) {
				// Add user message and bot response
				const newMessages = []
				if (data.userMessage) newMessages.push(data.userMessage)
				if (data.botResponse) newMessages.push(data.botResponse)
				
				setMessages(prev => [...prev, ...newMessages])
				setStepIndex(prev => prev + 1)
			} else {
				alert(data.error || "Failed to send message")
			}
		} catch (error) {
			console.error("Failed to send message:", error)
			alert("Failed to send message")
		}
	}

	const currentStep = steps[stepIndex]
	const isComplete = stepIndex >= steps.length

	if (status === "loading") {
		return <div className="min-h-screen flex items-center justify-center bg-slate-950">
			<div className="text-white">Loading...</div>
		</div>
	}

	return (
		<div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			{/* Sidebar */}
			<div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-slate-700/30 overflow-hidden`}>
				<div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
					{/* New Chat Button */}
					<div className="p-4 border-b border-slate-800/50">
						<button
							onClick={handleNewChat}
							className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-300 shadow-lg"
						>
							<Plus size={18} />
							<span className="font-semibold text-sm">New Account Setup</span>
						</button>
					</div>

					{/* Chat List */}
					<div className="flex-1 overflow-y-auto p-4 space-y-2">
						<h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
							Account Setups
						</h2>
						{chats.map((chat) => (
							<div
								key={chat._id}
								onClick={() => setCurrentChatId(chat._id)}
								className={`group p-3 rounded-xl cursor-pointer transition-all ${
									currentChatId === chat._id
										? "bg-blue-900/40 border border-blue-500/60"
										: "bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/40"
								}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2 flex-1">
										<MessageSquare size={14} className="text-blue-400" />
										<p className="text-sm font-medium text-gray-200 truncate">
											Account Setup {chat.title || ""}
										</p>
									</div>
									<button
										onClick={(e) => handleDeleteChat(chat._id, e)}
										className="opacity-0 group-hover:opacity-100 transition-all hover:text-red-400 p-1"
									>
										<Trash2 size={14} />
									</button>
								</div>
								<span className="text-xs text-gray-400 mt-1 block">
									{new Date(chat.createdAt).toLocaleDateString()}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="border-b border-slate-700/30 bg-slate-900/50 backdrop-blur-sm p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								onClick={() => setSidebarOpen(!sidebarOpen)}
								className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
							>
								<MessageSquare size={20} className="text-blue-400" />
							</button>
							<div>
								<h1 className="text-xl font-bold text-white">Create Account</h1>
								<p className="text-sm text-gray-400">Step-by-step account setup</p>
							</div>
						</div>
						{!isComplete && currentChatId && (
							<div className="text-sm text-gray-400">
								Step {stepIndex + 1} of {steps.length}
							</div>
						)}
					</div>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{!currentChatId ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-400">
							<MessageSquare size={48} className="mb-4 text-gray-600" />
							<p className="text-lg mb-2">Welcome to Account Creation</p>
							<p className="text-sm">Click "New Account Setup" to begin</p>
						</div>
					) : (
						<>
							{messages.map((msg, idx) => (
								<div
									key={idx}
									className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
								>
									{msg.sender === "bot" && (
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
											<Bot size={18} className="text-white" />
										</div>
									)}
									<div
										className={`max-w-[70%] rounded-2xl px-4 py-3 ${
											msg.sender === "user"
												? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
												: "bg-slate-800/60 text-gray-100"
										}`}
									>
										<p className="text-sm whitespace-pre-wrap">{msg.message}</p>
										<span className="text-xs opacity-60 mt-1 block">
											{new Date(msg.createdAt).toLocaleTimeString()}
										</span>
									</div>
									{msg.sender === "user" && (
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
											<User size={18} className="text-white" />
										</div>
									)}
								</div>
							))}
							{isComplete && (
								<div className="text-center text-green-400 mt-8">
									<p className="text-lg font-semibold">✓ Account setup complete!</p>
									<p className="text-sm text-gray-400 mt-2">Your account has been created successfully.</p>
								</div>
							)}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				{/* Input Form */}
				{currentChatId && !isComplete && (
					<div className="border-t border-slate-700/30 bg-slate-900/50 backdrop-blur-sm p-4">
						<form onSubmit={handleSendMessage} className="flex gap-3">
							{currentStep?.file ? (
								<>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*,.pdf"
										className="flex-1 bg-slate-800/60 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<button
										type="submit"
										disabled={loading || uploading}
										className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
									>
										{uploading ? "Uploading..." : <><Upload size={18} /> Upload</>}
									</button>
								</>
							) : (
								<>
									<input
										type="text"
										value={inputMessage}
										onChange={(e) => setInputMessage(e.target.value)}
										placeholder={currentStep?.prompt || "Type your message..."}
										className="flex-1 bg-slate-800/60 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
										disabled={loading}
									/>
									<button
										type="submit"
										disabled={loading || !inputMessage.trim()}
										className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
									>
										<Send size={18} />
										Send
									</button>
								</>
							)}
						</form>
					</div>
				)}
			</div>
		</div>
	)
}
