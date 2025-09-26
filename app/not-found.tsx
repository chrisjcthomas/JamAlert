import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Page Not Found</CardTitle>
            <CardDescription className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t worry, you can still access all JamAlert features from the homepage.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" className="w-full border-border hover:border-primary bg-transparent">
                  Get Help
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}