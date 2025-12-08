"use client"

import { useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import ChatWindow from "./ChatWindow"
import InputField from "./InputField"
import MenuButtons from "./MenuButtons"
import FileUploadModal from "./FileUploadModal"

export default function Dashboard() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [flow, setFlow] = useState(null)
  const [uploadModal, setUploadModal] = useState({ open: false, type: null })

  const sendMessage = useCallback(
    async (content) => {
      const userMessage = { role: "user", content, timestamp: new Date() }
      setMessages((prev) => [...prev, userMessage])
      setLoading(true)

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            userId: session.user.id,
            flow,
          }),
        })

        const data = await res.json()

        if (res.ok) {
          const botMessage = {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            action: data.action,
          }
          setMessages((prev) => [...prev, botMessage])

          if (data.action === "request_upload") {
            setUploadModal({ open: true, type: data.docType })
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "An error occurred. Please try again.",
              timestamp: new Date(),
            },
          ])
        }
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Connection error. Please try again.",
            timestamp: new Date(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [session, flow],
  )

  const handleSelectOption = async (option) => {
    setFlow(option)
    const welcomeMsg = {
      role: "assistant",
      content: "Starting account creation process. Let me begin by collecting your personal information.",
      timestamp: new Date(),
    }
    setMessages([welcomeMsg])
  }

  const handleFileUpload = (url) => {
    sendMessage(`File uploaded: ${url}`)
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-lg flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agentic Banking AI</h1>
              <p className="text-xs text-blue-100">Next-Gen Digital Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
              {session?.user?.image && (
                <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border-2 border-white" />
              )}
              <span className="text-sm font-medium">{session?.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-5 py-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <ChatWindow messages={messages} loading={loading} />

      {!flow ? (
        <MenuButtons onSelectOption={handleSelectOption} disabled={false} />
      ) : (
        <InputField onSubmit={sendMessage} loading={loading} />
      )}

      <FileUploadModal
        isOpen={uploadModal.open}
        onUpload={handleFileUpload}
        onClose={() => setUploadModal({ open: false, type: null })}
        docType={uploadModal.type}
      />
    </div>
  )
}
