"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Send, Bot, User, Upload, FileText } from "lucide-react"
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"

export default function LoanServicePage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const userId = session?.user?.id
	const [chats, setChats] = useState([])
	const [currentChatId, setCurrentChatId] = useState(null)
	const [messages, setMessages] = useState([])
	const [inputMessage, setInputMessage] = useState("")
	const [loading, setLoading] = useState(false)
	const [sidebarOpen, setSidebarOpen] = useState(false)
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

	const loadLoanChat = async (selectedChatId) => {
		setCurrentChatId(selectedChatId)
	}

	const createNewLoanChat = async () => {
		await handleNewChat()
	}

	if (status === "loading") {
		return (
			<div className="flex h-screen items-center justify-center bg-white">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					<div className="text-lg text-gray-600">Loading...</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
			<Navbar 
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
				sidebarOpen={sidebarOpen}
				session={session}
			/>

			<div className="flex flex-1 overflow-hidden">
				<Sidebar 
					isOpen={sidebarOpen} 
					onClose={() => setSidebarOpen(false)}
					activeChat={currentChatId}
					onChatSelect={loadLoanChat}
					onNewChat={createNewLoanChat}
					userId={userId}
				/>

				<div className="flex-1 flex flex-col bg-white overflow-hidden">
					{/* Chat Header */}
					<div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
						<h2 className="text-xl font-semibold text-gray-900">Loan Service Assistant</h2>
						<p className="text-sm text-gray-500 mt-1">Get personalized loan recommendations • Fast approval</p>
					</div>

					{/* Chat Messages - Fixed Height with Scroll */}
					<div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
					<div className="scrollbar-custom" style={{
						
						height:"60vh",
						overflowY: "scroll"
					}}>	
						{!currentChatId ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-500">
								<div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-full p-8 mb-6">
									<svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Loan Services</h3>
								<p className="text-lg text-gray-600 mb-8">Start a new conversation to explore loan options</p>
								<button 
									onClick={handleNewChat}
									className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md flex items-center gap-2 font-medium"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Start New Chat
								</button>
							</div>
						) : messages.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-500">
								<div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-full p-8 mb-6 animate-pulse">
									<svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
									</svg>
								</div>
								<p className="text-lg text-gray-600">Starting your loan inquiry...</p>
							</div>
						) : (
							<>
								{messages.filter(msg => msg && msg.sender).map((msg, idx) => (
									<div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
										<div className={`flex gap-3 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
											<div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
												msg.sender === "user" 
													? "bg-gradient-to-br from-purple-500 to-pink-600" 
													: "bg-gradient-to-br from-green-600 to-emerald-600"
											}`}>
												{msg.sender === "user" ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
											</div>
											
											<div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
												<div className={`px-4 py-3 rounded-2xl shadow-md border ${
													msg.sender === "user" 
														? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500 rounded-br-none" 
														: "bg-white text-gray-900 border-gray-200 rounded-bl-none"
												}`}>
													<p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
													{msg.fileUrl && (
														<a 
															href={msg.fileUrl} 
															target="_blank" 
															rel="noopener noreferrer"
															className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
																msg.sender === "user"
																	? "bg-white/20 hover:bg-white/30 text-white"
																	: "bg-gray-100 hover:bg-gray-200 text-gray-700"
															}`}
														>
															<FileText size={14} />
															View uploaded document
														</a>
													)}
												</div>
												<span className="text-xs text-gray-400 mt-1.5">
													{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</span>
											</div>
										</div>
									</div>
								))}
								<div ref={messagesEndRef} />
							</>
						)}
						</div>
					</div>

					{/* Input Area */}
					{currentChatId && (
						<div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
							{uploadingFile && (
								<div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-blue-900">Uploading document...</span>
										<span className="text-xs font-semibold text-blue-600">{uploadProgress}%</span>
									</div>
									<div className="w-full bg-blue-200 rounded-full h-2">
										<div
											className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${uploadProgress}%` }}
										/>
									</div>
								</div>
							)}
							<div className="flex items-end gap-3">
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
									className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl transition-all shadow-md flex items-center gap-2 font-medium disabled:opacity-50"
									title="Upload Income Proof or Documents"
								>
									<Upload size={18} />
									<span className="hidden sm:inline text-sm">Upload</span>
								</button>
								
								<div className="flex-1">
									<input
										type="text"
										value={inputMessage}
										onChange={(e) => setInputMessage(e.target.value)}
										onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage(e)}
										placeholder="Type your response or upload documents..."
										disabled={loading || uploadingFile}
										className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
									/>
								</div>

								<button
									onClick={handleSendMessage}
									disabled={!inputMessage.trim() || loading || uploadingFile}
									className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-all shadow-md flex items-center gap-2 font-medium text-white disabled:opacity-50"
								>
									{loading ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span className="hidden sm:inline text-sm">Sending</span>
										</>
									) : (
										<>
											<Send size={18} />
											<span className="hidden sm:inline text-sm">Send</span>
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}