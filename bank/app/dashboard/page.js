"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const page = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <div>
      <h1>Dashboard Page</h1>
      <p>Welcome, {session?.user?.name || session?.user?.email}!</p>
      <p>Email: {session?.user?.email}</p>
    </div>
  )
}

export default page
