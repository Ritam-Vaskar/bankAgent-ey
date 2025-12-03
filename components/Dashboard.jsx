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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bank Onboarding</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">{session?.user?.name}</span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Sign Out
          </button>
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
