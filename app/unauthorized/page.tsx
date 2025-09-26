import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this area. 
            Administrative privileges are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            If you believe you should have access to this area, 
            please contact your system administrator.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/admin/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Admin Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}