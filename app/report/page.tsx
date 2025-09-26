import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, Phone } from "lucide-react"
import Link from "next/link"
import { ReportForm } from "@/components/forms/report-form"

export default function ReportPage() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">JamAlert</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Report an Incident</h1>
            <p className="text-muted-foreground">
              Help keep your community safe by reporting incidents in your area. Your report will be reviewed and shared
              with relevant authorities and community members.
            </p>
          </div>

          {/* Emergency Notice */}
          <Card className="bg-destructive/5 border-destructive/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-destructive mt-1" />
                <div>
                  <h3 className="font-semibold text-destructive mb-2">Emergency Situations</h3>
                  <p className="text-sm text-muted-foreground">
                    For immediate life-threatening emergencies, call <strong>119</strong> (Police), <strong>110</strong>{" "}
                    (Fire), or <strong>911</strong> (Ambulance) first, then report here to help inform the community.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Form */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Incident Details</CardTitle>
              <CardDescription className="text-muted-foreground">
                Please provide as much detail as possible to help us understand and respond to the incident.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ReportForm />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Your report helps keep the community informed and safe. All reports are reviewed before being published.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
