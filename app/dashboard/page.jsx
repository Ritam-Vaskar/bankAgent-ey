"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()
  const userFromSession = session?.user || null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [user, setUser] = useState(userFromSession || { name: "User", email: "" })
  const [account, setAccount] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [applications, setApplications] = useState([])
  const [activity, setActivity] = useState([])

  const [tab, setTab] = useState("overview")

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [uRes, chatRes, appsRes, actRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/user/chat"),
          fetch("/api/user/applications"),
          fetch("/api/user/activity"),
        ])

        if (!uRes.ok || !chatRes.ok || !appsRes.ok || !actRes.ok) {
          throw new Error("Failed to load data")
        }

        const uJson = await uRes.json()
        const chatJson = await chatRes.json()
        const appsJson = await appsRes.json()
        const actJson = await actRes.json()

        if (!mounted) return
        setUser(uJson.user || (userFromSession || user))
        setAccount(uJson.account || null)
        setChatHistory(chatJson.chatHistory || [])
        setApplications(appsJson.applications || [])
        setActivity(actJson.activity || [])
      } catch (err) {
        console.error(err)
        if (mounted) setError("Unable to load dashboard data")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchAll()
    return () => { mounted = false }
  }, [userFromSession])

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: account?.currency || "USD" }).format(v || 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-rose-200 text-rose-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-800">Home</Link>
            <Link href="/profile" className="text-sm text-slate-600 hover:text-slate-800">Profile</Link>
            <Link href="/api/auth/signout" className="text-sm text-slate-600 hover:text-slate-800">Sign out</Link>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-sm text-slate-500 uppercase tracking-wide mb-2">Account Summary</h3>
                <div className="text-sm text-slate-700">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Account</span>
                    <span className="font-medium">{account?.number || "-"}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium">{account?.type || "-"}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Branch</span>
                    <span className="font-medium">{account?.branch || "-"}</span>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-slate-500">Available Balance</span>
                    <span className="text-2xl font-semibold">{formatCurrency(account?.balance)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-sm text-slate-500 uppercase tracking-wide mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-3 bg-white border border-slate-200 rounded-md hover:shadow-sm text-sm">Transfer</button>
                  <button className="py-2 px-3 bg-white border border-slate-200 rounded-md hover:shadow-sm text-sm">Statements</button>
                  <button className="py-2 px-3 bg-white border border-slate-200 rounded-md hover:shadow-sm text-sm">Apply Loan</button>
                  <button className="py-2 px-3 bg-white border border-slate-200 rounded-md hover:shadow-sm text-sm">Request Card</button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Recent Activity</h4>
              <ul className="space-y-3 text-sm text-slate-700">
                {activity.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-500">{a.time}</div>
                      <div className="font-medium">{a.text}</div>
                    </div>
                    <div className="text-xs text-slate-400">{a.meta}</div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <nav className="flex items-center gap-3">
                <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
                <TabButton label="Chat History" active={tab === "chat"} onClick={() => setTab("chat")} />
                <TabButton label="Applications" active={tab === "apps"} onClick={() => setTab("apps")} />
                <TabButton label="Activity" active={tab === "activity"} onClick={() => setTab("activity")} />
                <div className="ml-auto text-sm text-slate-500">Last login: 2025-11-20 09:10</div>
              </nav>
            </div>

            {/* Overview */}
            {tab === "overview" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="text-xs text-slate-500">Available Balance</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(account?.balance)}</div>
                    <div className="text-xs text-slate-400 mt-2">Updated: Today</div>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="text-xs text-slate-500">Open Applications</div>
                    <div className="text-2xl font-bold mt-1">{applications.filter(a => a.status !== "Approved").length}</div>
                    <div className="text-xs text-slate-400 mt-2">Track application progress</div>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="text-xs text-slate-500">Chats</div>
                    <div className="text-2xl font-bold mt-1">{chatHistory.length}</div>
                    <div className="text-xs text-slate-400 mt-2">Recent conversations with agents</div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat History */}
            {tab === "chat" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Chat History</h3>
                <div className="space-y-3">
                  {chatHistory.map((c) => (
                    <div key={c.id} className="p-3 border border-slate-100 rounded-lg flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{c.agent}</div>
                        <div className="text-xs text-slate-500">{c.time}</div>
                        <div className="mt-2 text-slate-700">{c.summary}</div>
                      </div>
                      <div className="text-sm">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications */}
            {tab === "apps" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Applications</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500">
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Applied</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {applications.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">{a.id}</td>
                          <td className="py-3 px-3">{a.type}</td>
                          <td className="py-3 px-3">{a.applied}</td>
                          <td className="py-3 px-3">{a.amount ? formatCurrency(a.amount) : "-"}</td>
                          <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <button className="text-sm text-blue-600 hover:underline">View</button>
                              <button className="text-sm text-slate-600 hover:underline">Download</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity */}
            {tab === "activity" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  {activity.map((a) => (
                    <li key={a.id} className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-slate-500">{a.time}</div>
                        <div className="font-medium">{a.text}</div>
                      </div>
                      <div className="text-xs text-slate-400">{a.meta}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

/* helper components */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
        active ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    Approved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    "Under Review": "bg-amber-50 text-amber-700 border border-amber-100",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-100",
    Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    "Follow-up": "bg-slate-50 text-slate-700 border border-slate-100",
    default: "bg-slate-50 text-slate-700 border border-slate-100",
  }
  const cls = map[status] || map.default
  return <span className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded ${cls}`}>{status}</span>
}
