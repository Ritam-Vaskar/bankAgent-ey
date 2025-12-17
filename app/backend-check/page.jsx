
"use client"

import { useState } from 'react'

export default function BackendCheck() {
  const [aadhaarResponse, setAadhaarResponse] = useState(null)
  const [panResponse, setPanResponse] = useState(null)
  const [aadhaarLoading, setAadhaarLoading] = useState(false)
  const [panLoading, setPanLoading] = useState(false)
  const [incomeResponse, setIncomeResponse] = useState(null)
  const [incomeLoading, setIncomeLoading] = useState(false)
  const [bankResponse, setBankResponse] = useState(null)
  const [bankLoading, setBankLoading] = useState(false)
  const [loanBgResponse, setLoanBgResponse] = useState(null)
  const [loanBgLoading, setLoanBgLoading] = useState(false)
  const [loanDetailsResponse, setLoanDetailsResponse] = useState(null)
  const [loanDetailsLoading, setLoanDetailsLoading] = useState(false)

  // Controlled inputs for non-file endpoints
  const [bankPan, setBankPan] = useState("")
  const [loanBgPan, setLoanBgPan] = useState("")
  const [loanDetPan, setLoanDetPan] = useState("")
  const [loanDetMonthlyNet, setLoanDetMonthlyNet] = useState("")
  const [loanDetAnnualIncome, setLoanDetAnnualIncome] = useState("")
  const [loanDetGstTurnover, setLoanDetGstTurnover] = useState("")

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

  const handleIncomeSubmit = async (e) => {
    e.preventDefault()
    setIncomeLoading(true)
    setIncomeResponse(null)

    const formData = new FormData(e.target)

    try {
      const response = await fetch('/api/upload/Income_proof', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      setIncomeResponse({ status: response.status, data: result, success: response.ok })
    } catch (error) {
      setIncomeResponse({ status: 'Network Error', data: { error: error.message }, success: false })
    } finally {
      setIncomeLoading(false)
    }
  }

  const handleBankPost = async (e) => {
    e.preventDefault()
    if (!bankPan) return
    setBankLoading(true)
    setBankResponse(null)
    try {
      const response = await fetch('/api/upload/Bank_details_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: bankPan }),
      })
      const result = await response.json()
      setBankResponse({ status: response.status, data: result, success: response.ok })
    } catch (error) {
      setBankResponse({ status: 'Network Error', data: { error: error.message }, success: false })
    } finally {
      setBankLoading(false)
    }
  }

  // Loan Background Check
  const handleLoanBgPost = async (e) => {
    e.preventDefault()
    if (!loanBgPan) return
    setLoanBgLoading(true)
    setLoanBgResponse(null)
    try {
      const response = await fetch('/api/upload/loan_background_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: loanBgPan }),
      })
      const result = await response.json()
      setLoanBgResponse({ status: response.status, data: result, success: response.ok })
    } catch (error) {
      setLoanBgResponse({ status: 'Network Error', data: { error: error.message }, success: false })
    } finally {
      setLoanBgLoading(false)
    }
  }

  // Loan Details (Aggregator)
  const handleLoanDetailsPost = async (e) => {
    e.preventDefault()
    setLoanDetailsLoading(true)
    setLoanDetailsResponse(null)
    try {
      const payload = {
        pan: loanDetPan || undefined,
        income: {
          monthlyNetSalary: loanDetMonthlyNet || undefined,
          annualNetIncome: loanDetAnnualIncome || undefined,
          gstTurnover: loanDetGstTurnover || undefined,
        },
      }
      const response = await fetch('/api/upload/loan_details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      setLoanDetailsResponse({ status: response.status, data: result, success: response.ok })
    } catch (error) {
      setLoanDetailsResponse({ status: 'Network Error', data: { error: error.message }, success: false })
    } finally {
      setLoanDetailsLoading(false)
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
    <div className="h-[100vh] overflow-y-scroll bg-gray-50 p-8">
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

        {/* Income Proof Upload */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🧾 Income Proof Upload</h2>
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document (Salary Slip / ITR / GST Return)</label>
              <input
                type="file"
                name="file"
                accept="image/*,.pdf"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={incomeLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {incomeLoading ? 'Uploading...' : 'Upload & Analyze Income'}
            </button>
          </form>
          <ResponseDisplay response={incomeResponse} title="Income Proof" />
        </div>

        {/* Bank Details Check */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">🏦 Bank Details Check</h2>
          <form onSubmit={handleBankPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={bankPan}
                onChange={(e) => setBankPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                maxLength="10"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={bankLoading || !bankPan}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {bankLoading ? 'Loading...' : 'POST JSON'}
              </button>
            </div>
          </form>
          <div className="text-xs text-gray-600 mt-2">Response includes <span className="font-mono">totalAmount</span>, <span className="font-mono">accounts[]</span>, and <span className="font-mono">count</span>.</div>
          <ResponseDisplay response={bankResponse} title="Bank Details" />
        </div>

        {/* Loan Background Check */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-rose-600">📚 Loan Background Check</h2>
          <form onSubmit={handleLoanBgPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={loanBgPan}
                onChange={(e) => setLoanBgPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent uppercase"
                maxLength="10"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loanBgLoading || !loanBgPan}
                className="flex-1 bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700 disabled:bg-gray-400"
              >
                {loanBgLoading ? 'Loading...' : 'POST JSON'}
              </button>
            </div>
          </form>
          <div className="text-xs text-gray-600 mt-2">Response includes grouped <span className="font-mono">active/closed/overdue</span> and <span className="font-mono">totals</span>.</div>
          <ResponseDisplay response={loanBgResponse} title="Loan Background" />
        </div>

        {/* Loan Details Aggregator */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-teal-600">📊 Loan Details (Aggregator)</h2>
          <form onSubmit={handleLoanDetailsPost} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN (optional)</label>
                <input
                  type="text"
                  value={loanDetPan}
                  onChange={(e) => setLoanDetPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase"
                  maxLength="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Net Income (₹)</label>
                <input
                  type="number"
                  value={loanDetMonthlyNet}
                  onChange={(e) => setLoanDetMonthlyNet(e.target.value)}
                  placeholder="e.g. 55000"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
                <input
                  type="number"
                  value={loanDetAnnualIncome}
                  onChange={(e) => setLoanDetAnnualIncome(e.target.value)}
                  placeholder="e.g. 600000"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Turnover (₹, optional)</label>
                <input
                  type="number"
                  value={loanDetGstTurnover}
                  onChange={(e) => setLoanDetGstTurnover(e.target.value)}
                  placeholder="e.g. 2500000"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loanDetailsLoading}
                className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-400"
              >
                {loanDetailsLoading ? 'Loading...' : 'POST JSON'}
              </button>
            </div>
          </form>
          <div className="text-xs text-gray-600 mt-2">Returns <span className="font-mono">inputs</span> summary and <span className="font-mono">recommendations[]</span> with eligible amounts and EMIs.</div>
          <ResponseDisplay response={loanDetailsResponse} title="Loan Details" />
        </div>

        {/* Test Buttons removed: endpoints are POST-only now */}
      </div>
    </div>
  )
}