import { Geist, Geist_Mono } from "next/font/google"
import SessionWrapper from "../components/SessionWrapper"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "Banking Onboarding",
  description: "Start your banking onboarding journey",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <SessionWrapper>
        <body className={geist.className}>{children}</body>
      </SessionWrapper>
    </html>
  )
}
