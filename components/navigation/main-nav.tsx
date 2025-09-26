"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Shield, Menu, Bell, MapPin, AlertTriangle, HelpCircle, User, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const publicNavItems = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/map", label: "Live Map", icon: MapPin },
  { href: "/report", label: "Report", icon: AlertTriangle },
  { href: "/help", label: "Help", icon: HelpCircle },
]

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: User },
  { href: "/my-alerts", label: "My Alerts", icon: Bell },
  { href: "/report", label: "Report", icon: AlertTriangle },
]

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, signOut } = useAuth()

  const navItems = isAuthenticated ? userNavItems : publicNavItems

  const NavLink = ({
    href,
    label,
    icon: Icon,
    mobile = false,
  }: {
    href: string
    label: string
    icon: any
    mobile?: boolean
  }) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 transition-colors",
          mobile ? "px-4 py-2 rounded-lg hover:bg-muted" : "text-sm hover:text-primary",
          isActive ? (mobile ? "bg-primary/10 text-primary" : "text-primary font-medium") : "text-muted-foreground",
        )}
        onClick={() => mobile && setIsOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    )
  }

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">JamAlert</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <User className="h-4 w-4" />
                {user?.name}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-border hover:border-primary bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-border hover:border-primary bg-transparent">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="sm" className="border-border bg-transparent">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-card border-border">
            <div className="flex flex-col gap-4 mt-8">
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} mobile />
              ))}

              {/* Auth Actions */}
              <div className="mt-6 pt-6 border-t border-border">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    onClick={signOut}
                    className="w-full border-border hover:border-primary bg-transparent"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border-border hover:border-primary bg-transparent">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="block">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Register for Alerts
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
