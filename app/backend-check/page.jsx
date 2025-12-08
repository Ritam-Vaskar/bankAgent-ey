"use client"

import { useState } from 'react'

export default function BackendCheck() {
  const [aadhaarResponse, setAadhaarResponse] = useState(null)
  const [panResponse, setPanResponse] = useState(null)
  const [aadhaarLoading, setAadhaarLoading] = useState(false)
  const [panLoading, setPanLoading] = useState(false)

  const handleAadhaarSubmit = async (e) => {
    e.preventDefault()
    setAadhaarLoading(true)
    setAadhaarResponse(null)

    const formData = new FormData(e.target)

    try {
      const response = await fetch('/api/upload/aadhaar', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      setAadhaarResponse({
        status: response.status,
        data: result,
        success: response.ok
      })
    } catch (error) {
      setAadhaarResponse({
        status: 'Network Error',
        data: { error: error.message },
        success: false
      })
    } finally {
      setAadhaarLoading(false)
    }
  }

  const handlePanSubmit = async (e) => {
    e.preventDefault()
    setPanLoading(true)
    setPanResponse(null)

    const formData = new FormData(e.target)

    try {
      const response = await fetch('/api/upload/pan', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      setPanResponse({
        status: response.status,
        data: result,
        success: response.ok
      })
    } catch (error) {
      setPanResponse({
        status: 'Network Error',
        data: { error: error.message },
        success: false
      })
    } finally {
      setPanLoading(false)
    }
  }

  const ResponseDisplay = ({ response, title }) => {
    if (!response) return null

    return (
      <div className="mt-4 p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">{title} Response:</h4>
        <div className={`p-3 rounded text-sm ${response.success ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
          <div className="mb-2">
            <strong>Status:</strong> {response.status}
          </div>
          <div>
            <strong>Response:</strong>
            <pre className="mt-1 whitespace-pre-wrap overflow-auto max-h-60">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Backend Upload Test</h1>
        
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-8">
          <p className="text-sm">
            <strong>Note:</strong> These uploads require authentication. Make sure you're logged in to the main application first, 
            or you'll receive "Unauthorized" errors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Aadhaar Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">📄 Aadhaar Upload</h2>
            
            <form onSubmit={handleAadhaarSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhaar File (Image/PDF)
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/*,.pdf"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter name as on Aadhaar"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  name="aadhaarNo"
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength="14"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dob"
                  placeholder="DD/MM/YYYY"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={aadhaarLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {aadhaarLoading ? 'Uploading...' : 'Upload Aadhaar'}
              </button>
            </form>

            <ResponseDisplay response={aadhaarResponse} title="Aadhaar" />
          </div>

          {/* PAN Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-600">💳 PAN Upload</h2>
            
            <form onSubmit={handlePanSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN File (Image/PDF)
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/*,.pdf"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter name as on PAN"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  placeholder="Enter 10-character PAN number"
                  maxLength="10"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dob"
                  placeholder="DD/MM/YYYY"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={panLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {panLoading ? 'Uploading...' : 'Upload PAN'}
              </button>
            </form>

            <ResponseDisplay response={panResponse} title="PAN" />
          </div>
        </div>

        {/* Test Buttons */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Quick Tests</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => fetch('/api/upload/aadhaar').then(r => r.json()).then(console.log)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
            >
              Test Aadhaar GET
            </button>
            <button
              onClick={() => fetch('/api/upload/pan').then(r => r.json()).then(console.log)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
            >
              Test PAN GET
            </button>
            <button
              onClick={() => fetch('/api/test-auth').then(r => r.json()).then(console.log)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200"
            >
              Check Auth Status
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Check browser console for GET request responses
          </p>
          <div className="mt-4 p-3 bg-orange-50 rounded-md">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Azure Configuration Required:</strong> Make sure to set up your Azure Storage environment variables 
              (AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY) for file uploads to work.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}