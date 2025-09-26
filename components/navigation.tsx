"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Shield, Menu, X } from "lucide-react"
import { useState } from "react"

const publicRoutes = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/report", label: "Report" },
  { href: "/my-alerts", label: "My Alerts" },
  { href: "/help", label: "Help" },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isAdminRoute = pathname.startsWith("/admin")

  if (isAdminRoute) return null

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JamAlert</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {publicRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.label}
              </Link>
            ))}
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/login">Admin</Link>
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {publicRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "block px-2 py-1 text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setIsOpen(false)}
              >
                {route.label}
              </Link>
            ))}
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href="/admin/login">Admin Login</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
