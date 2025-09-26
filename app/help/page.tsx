import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Shield, ArrowLeft, Phone, Mail, MessageCircle, AlertTriangle, Bell, MapPin } from "lucide-react"
import Link from "next/link"

const emergencyNumbers = [
  { service: "Police", number: "119", icon: "🚔" },
  { service: "Fire Department", number: "110", icon: "🚒" },
  { service: "Ambulance", number: "911", icon: "🚑" },
  { service: "Disaster Emergency", number: "116", icon: "🆘" },
]

const faqItems = [
  {
    question: "How do I register for alerts?",
    answer:
      "Click the 'Register for Alerts' button on the homepage and fill out the registration form with your contact information and location preferences. You'll receive alerts relevant to your area.",
  },
  {
    question: "What types of incidents can I report?",
    answer:
      "You can report various incidents including flooding, traffic accidents, fires, power outages, severe weather, security incidents, medical emergencies, and infrastructure issues.",
  },
  {
    question: "How quickly are reports reviewed?",
    answer:
      "High-priority emergency reports are reviewed within 15 minutes. Medium priority reports within 1 hour, and low priority reports within 4 hours during business hours.",
  },
  {
    question: "Can I report incidents anonymously?",
    answer:
      "Yes, you can choose to submit reports anonymously. However, providing contact information helps us verify details and provide updates if needed.",
  },
  {
    question: "How do I update my alert preferences?",
    answer:
      "Visit the 'My Alerts' page to manage your notification preferences, update your location, or change your contact information.",
  },
  {
    question: "What should I do in a life-threatening emergency?",
    answer:
      "For immediate life-threatening emergencies, always call the appropriate emergency services first (119 for Police, 110 for Fire, 911 for Ambulance), then report on JamAlert to inform the community.",
  },
  {
    question: "How accurate is the incident map?",
    answer:
      "The incident map shows verified reports from community members and official sources. All reports are reviewed for accuracy before being displayed publicly.",
  },
  {
    question: "Can I receive alerts for multiple locations?",
    answer:
      "Currently, alerts are sent based on your primary registered location. You can update your location in your account settings as needed.",
  },
]

export default function HelpPage() {
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Help & Support</h1>
            <p className="text-muted-foreground">
              Find answers to common questions and learn how to use JamAlert effectively to stay safe and informed.
            </p>
          </div>

          {/* Emergency Numbers */}
          <Card className="bg-destructive/5 border-destructive/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Phone className="h-5 w-5" />
                Emergency Numbers
              </CardTitle>
              <CardDescription>For immediate life-threatening emergencies, call these numbers first:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {emergencyNumbers.map((emergency) => (
                  <Card key={emergency.service} className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{emergency.icon}</div>
                      <div className="font-semibold text-foreground">{emergency.service}</div>
                      <div className="text-lg font-bold text-destructive">{emergency.number}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Get Alerts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register to receive emergency notifications for your area
                </p>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Register Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-warning/10 w-fit mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Report Incident</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help your community by reporting incidents in your area
                </p>
                <Link href="/report">
                  <Button variant="outline" className="border-border hover:border-primary bg-transparent">
                    Report Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-lg bg-success/10 w-fit mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">View Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See real-time incidents and alerts on the interactive map
                </p>
                <Link href="/#map">
                  <Button variant="outline" className="border-border hover:border-primary bg-transparent">
                    View Map
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Common questions about using JamAlert and staying safe in your community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border">
                    <AccordionTrigger className="text-foreground hover:text-primary">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Need More Help?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Can&apos;t find what you&apos;re looking for? Get in touch with our support team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email Support</h4>
                    <p className="text-sm text-muted-foreground mb-2">Get help via email within 24 hours</p>
                    <a
                      href="mailto:support@jamalert.jm"
                      className="text-primary hover:text-primary/80 text-sm transition-colors"
                    >
                      support@jamalert.jm
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <MessageCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Community Forum</h4>
                    <p className="text-sm text-muted-foreground mb-2">Connect with other community members</p>
                    <a href="#" className="text-primary hover:text-primary/80 text-sm transition-colors">
                      Visit Forum
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
