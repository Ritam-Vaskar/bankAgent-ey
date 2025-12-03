"use client"

export default function MenuButtons({ onSelectOption, disabled }) {
  return (
    <div className="flex gap-2 p-4 bg-gray-100 border-t">
      <button
        onClick={() => onSelectOption("account")}
        disabled={disabled}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Create Account
      </button>
      <button
        disabled
        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
        title="Coming soon"
      >
        Loan
      </button>
      <button
        disabled
        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
        title="Coming soon"
      >
        Credit Card
      </button>
    </div>
  )
}
