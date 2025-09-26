import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JamAlert - Community Resilience Alert System",
  description: "Stay informed and stay safe with Jamaica's community-driven alert system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
