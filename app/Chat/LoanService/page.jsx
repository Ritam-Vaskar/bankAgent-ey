"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoanServicePage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [chats, setChats] = useState([])
	const [currentChatId, setCurrentChatId] = useState(null)
	const [messages, setMessages] = useState([])
	const [inputMessage, setInputMessage] = useState("")
	const [loading, setLoading] = useState(false)
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [uploadingFile, setUploadingFile] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const messagesEndRef = useRef(null)
	const fileInputRef = useRef(null)

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
		}
	}, [currentChatId])

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const loadChats = async () => {
		try {
			const res = await fetch("/api/chat/loanservice")
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
			const res = await fetch(`/api/chat/loanservice/${chatId}/messages`)
			const data = await res.json()
			if (res.ok) {
				setMessages(data.messages || [])
			}
		} catch (error) {
			console.error("Failed to load messages:", error)
		}
	}

	const handleNewChat = async () => {
		try {
			const res = await fetch("/api/chat/loanservice", {
				method: "POST",
			})
			const data = await res.json()
			if (res.ok) {
				setChats((prev) => [data.chat, ...prev])
				setCurrentChatId(data.chat._id)
				setMessages([])
				
				// Send initial message to start the flow
				setTimeout(async () => {
					const initRes = await fetch(`/api/chat/loanservice/${data.chat._id}/messages`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ message: "Hi" }),
					})
					const initData = await initRes.json()
					if (initRes.ok) {
						setMessages([initData.userMessage, initData.botMessage])
					}
				}, 100)
			}
		} catch (error) {
			console.error("Failed to create chat:", error)
		}
	}

	const handleSendMessage = async (e) => {
		e.preventDefault()
		if (!inputMessage.trim() || !currentChatId || loading) return

		const messageText = inputMessage.trim()
		setInputMessage("")
		setLoading(true)

		try {
			const res = await fetch(`/api/chat/loanservice/${currentChatId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: messageText }),
			})

			const data = await res.json()
			if (res.ok) {
				setMessages((prev) => [...prev, data.userMessage, data.botMessage])
			}
		} catch (error) {
			console.error("Failed to send message:", error)
		} finally {
			setLoading(false)
		}
	}

	const handleFileUpload = async (e) => {
		const file = e.target.files?.[0]
		if (!file || !currentChatId) return

		setUploadingFile(true)
		setUploadProgress(0)

		try {
			const formData = new FormData()
			formData.append("file", file)

			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			})

			if (!uploadRes.ok) throw new Error("Upload failed")

			const { url } = await uploadRes.json()
			setUploadProgress(50)

			// Send message with file URL
			const res = await fetch(`/api/chat/loanservice/${currentChatId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					message: `Uploaded ${file.name}`,
					fileUrl: url 
				}),
			})

			const data = await res.json()
			if (res.ok) {
				setMessages((prev) => [...prev, data.userMessage, data.botMessage])
			}
			setUploadProgress(100)
		} catch (error) {
			console.error("Failed to upload file:", error)
			alert("Failed to upload file")
		} finally {
			setUploadingFile(false)
			setUploadProgress(0)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	const handleDeleteChat = async (chatId) => {
		if (!confirm("Delete this chat?")) return
		try {
			const res = await fetch(`/api/chat/loanservice/${chatId}`, {
				method: "DELETE",
			})
			if (res.ok) {
				setChats((prev) => prev.filter((c) => c._id !== chatId))
				if (currentChatId === chatId) {
					setCurrentChatId(null)
					setMessages([])
				}
			}
		} catch (error) {
			console.error("Failed to delete chat:", error)
		}
	}

	if (status === "loading") {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<div
				className={`${
					sidebarOpen ? "w-64" : "w-0"
				} bg-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
			>
				<div className="p-4 border-b border-gray-700">
					<button
						onClick={handleNewChat}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
					>
						<span className="text-xl">+</span>
						New Chat
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-2">
					{chats.map((chat) => (
						<div
							key={chat._id}
							className={`group relative p-3 mb-2 rounded-lg cursor-pointer transition duration-200 ${
								currentChatId === chat._id
									? "bg-gray-700"
									: "hover:bg-gray-800"
							}`}
							onClick={() => setCurrentChatId(chat._id)}
						>
							<div className="flex items-center justify-between">
								<span className="truncate text-sm">
									Loan Chat {new Date(chat.createdAt).toLocaleDateString()}
								</span>
								<button
									onClick={(e) => {
										e.stopPropagation()
										handleDeleteChat(chat._id)
									}}
									className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
								>
									🗑️
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="text-gray-600 hover:text-gray-900"
					>
						☰
					</button>
					<h1 className="text-xl font-semibold text-gray-800">Loan Service</h1>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{!currentChatId ? (
						<div className="h-full flex flex-col items-center justify-center text-gray-500">
							<div className="text-6xl mb-4">💬</div>
							<p className="text-lg">Click "New Chat" to start a conversation</p>
						</div>
					) : messages.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-gray-500">
							<div className="text-6xl mb-4">💰</div>
							<p className="text-lg">Start your loan inquiry</p>
						</div>
					) : (
						<>
							{messages.filter(msg => msg && msg.sender).map((msg, idx) => (
								<div
									key={idx}
									className={`flex ${
										msg.sender === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-xl px-4 py-2 rounded-lg ${
											msg.sender === "user"
												? "bg-blue-600 text-white"
												: "bg-white text-gray-800 border border-gray-200"
										}`}
									>
										<p className="whitespace-pre-wrap">{msg.message}</p>
										{msg.fileUrl && (
											<a 
												href={msg.fileUrl} 
												target="_blank" 
												rel="noopener noreferrer"
												className="text-xs underline mt-2 block"
											>
												View uploaded file
											</a>
										)}
										<span className="text-xs opacity-70 mt-1 block">
											{new Date(msg.createdAt).toLocaleTimeString()}
										</span>
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				{/* Input */}
				{currentChatId && (
					<div className="bg-white border-t border-gray-200 p-4">
						{uploadingFile && (
							<div className="mb-2">
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${uploadProgress}%` }}
									/>
								</div>
								<p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
							</div>
						)}
						<form onSubmit={handleSendMessage} className="flex gap-2">
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileUpload}
								accept="image/*,.pdf"
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploadingFile || loading}
								className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2 font-medium"
								title="Upload Income Proof Document"
							>
								📎 Upload
							</button>
							<input
								type="text"
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								placeholder="Type your response or click 'Upload' for documents..."
								disabled={loading || uploadingFile}
								className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
							/>
							<button
								type="submit"
								disabled={!inputMessage.trim() || loading || uploadingFile}
								className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
							>
								{loading ? "..." : "Send"}
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	)
}