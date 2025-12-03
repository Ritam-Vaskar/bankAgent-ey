export default function MessageBubble({ role, content, timestamp }) {
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-200 text-gray-900 rounded-bl-none"
        }`}
      >
        <p className="text-sm">{content}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  )
}
