"use client"

import { useState } from "react"

export default function FileUploadModal({ isOpen, onUpload, onClose, docType = "Document" }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

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

  const docIcon = {
    aadhaar: (
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
    pan: (
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  }[docType.toLowerCase()] || null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl border border-slate-200/60 animate-[slideUp_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center border border-slate-200/60 shadow-sm">
              <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-1">Upload {docType}</h2>
              <p className="text-sm text-slate-500">Secure document verification</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={uploading} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-6 p-10 border-2 border-dashed rounded-xl transition-all duration-300 ${
            dragActive
              ? "border-slate-400 bg-slate-50 shadow-inner"
              : file
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.xml"
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className={`mb-4 transition-colors ${file ? "text-emerald-600" : "text-slate-400"}`}>
              {file ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-200/30 rounded-full blur-xl"></div>
                  <svg className="w-14 h-14 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                docIcon || (
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              )}
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-emerald-700 mb-2">Document Selected</p>
                <p className="text-sm text-slate-700 bg-white px-4 py-2 rounded-lg border border-slate-200 mb-2 font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 mb-2">Drag and drop your document here</p>
                <p className="text-xs text-slate-500 mb-3">or click to browse from your device</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF, XML • Max 10MB
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Security Notice */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200/60">
          <svg className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">Secure Upload</p>
            <p className="text-xs text-slate-500 leading-relaxed">Your documents are encrypted and securely processed in compliance with banking regulations.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-6 py-3.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 disabled:hover:bg-slate-800 disabled:hover:shadow-sm"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Document</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all duration-200 font-medium border border-slate-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}