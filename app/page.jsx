"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Globalchat from "@/components/Globalchat.jsx"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }
console.log("Session data:", session)
  if (!session) {

    return null
  }

  return <Globalchat />
}
