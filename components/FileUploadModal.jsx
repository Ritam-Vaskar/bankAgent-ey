"use client"

import { useState } from "react"

export default function FileUploadModal({ isOpen, onUpload, onClose, docType = "Document" }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", docType.toLowerCase())

      const res = await fetch(`/api/upload/${docType.toLowerCase()}`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        onUpload(data.url)
        setFile(null)
        onClose()
      } else {
        alert("Upload failed: " + data.error)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload error occurred")
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Upload {docType}</h2>

        <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <input type="file" onChange={handleFileChange} accept=".pdf,.xml" className="w-full" />
          {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
