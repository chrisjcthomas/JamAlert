"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, AlertTriangle, Loader2, CheckCircle, Save, RefreshCw } from "lucide-react"
import { 
  submitIncidentReport, 
  formDataToApiRequest, 
  saveDraftToStorage, 
  loadDraftFromStorage, 
  clearDraftFromStorage,
  hasDraftInStorage,
  type IncidentReportFormData,
  type IncidentReportResponse 
} from "@/lib/api/incidents"
import { getErrorMessage, getValidationErrors } from "@/lib/api-client"

const incidentTypes = [
  { value: "flood", label: "Flooding", icon: "🌊" },
  { value: "accident", label: "Traffic Accident", icon: "🚗" },
  { value: "fire", label: "Fire", icon: "🔥" },
  { value: "power", label: "Power Outage", icon: "⚡" },
  { value: "weather", label: "Severe Weather", icon: "🌪️" },
  { value: "crime", label: "Security Incident", icon: "🚨" },
  { value: "medical", label: "Medical Emergency", icon: "🏥" },
  { value: "infrastructure", label: "Infrastructure", icon: "🏗️" },
  { value: "other", label: "Other", icon: "📍" },
]

const severityLevels = [
  { value: "low", label: "Low", description: "Minor incident, no immediate danger", color: "success" },
  { value: "medium", label: "Medium", description: "Moderate impact, some disruption", color: "warning" },
  { value: "high", label: "High", description: "Serious incident, immediate attention needed", color: "destructive" },
]

const parishes = [
  "Kingston",
  "St. Andrew",
  "St. Thomas",
  "Portland",
  "St. Mary",
  "St. Ann",
  "Trelawny",
  "St. James",
  "Hanover",
  "Westmoreland",
  "St. Elizabeth",
  "Manchester",
  "Clarendon",
  "St. Catherine",
]

// Use the interface from the API module
type ReportFormData = IncidentReportFormData

export function ReportForm() {
  const [formData, setFormData] = useState<ReportFormData>(() => ({
    incidentType: "",
    severity: "",
    parish: "",
    community: "",
    address: "",
    description: "",
    date: "", // Will be set on client side
    time: "",
    reporterName: "",
    reporterPhone: "",
    anonymous: false,
    receiveUpdates: false,
  }))
  
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isDraft, setIsDraft] = useState(false)
  const [reportResponse, setReportResponse] = useState<IncidentReportResponse | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const router = useRouter()

  // Set today's date on client side and check for drafts
  useEffect(() => {
    // Set today's date if not set
    if (!formData.date) {
      setFormData(prev => ({ 
        ...prev, 
        date: new Date().toISOString().split('T')[0] 
      }))
    }
    
    // Check if there's a saved draft
    setHasDraft(hasDraftInStorage())
  }, [formData.date])

  // Load draft from storage
  const loadDraft = () => {
    const draft = loadDraftFromStorage()
    if (draft) {
      setFormData({
        incidentType: draft.incidentType,
        severity: draft.severity,
        parish: draft.parish,
        community: draft.community,
        address: draft.address,
        description: draft.description,
        date: draft.date,
        time: draft.time,
        reporterName: draft.reporterName,
        reporterPhone: draft.reporterPhone,
        anonymous: draft.anonymous,
        receiveUpdates: draft.receiveUpdates,
      })
      setHasDraft(false)
    }
  }

  // Auto-save draft every 30 seconds if form has content
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.description.trim() || formData.incidentType || formData.severity) {
        saveDraftToStorage(formData)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [formData])

  const handleInputChange = (field: keyof ReportFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Clear general error
    if (error) {
      setError("")
    }
  }

  const getSeverityColor = (color: string) => {
    switch (color) {
      case "success":
        return "bg-success/10 text-success border-success/20"
      case "warning":
        return "bg-warning/10 text-warning border-warning/20"
      case "destructive":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  const validateForm = (isDraftSave = false): string | null => {
    if (!isDraftSave) {
      if (!formData.incidentType) return "Please select an incident type"
      if (!formData.severity) return "Please select a severity level"
      if (!formData.parish) return "Please select a parish"
      if (!formData.description.trim()) return "Please provide a description"
      if (!formData.date) return "Please provide the date"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    setError("")
    setValidationErrors({})
    setIsDraft(saveAsDraft)
    
    if (saveAsDraft) {
      // Save as draft to localStorage
      saveDraftToStorage(formData)
      setSuccess(true)
      return
    }
    
    // Validate form for submission
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsLoading(true)
    
    try {
      // Convert form data to API request format
      const apiRequest = formDataToApiRequest(formData)
      
      // Submit to backend API
      const response = await submitIncidentReport(apiRequest)
      
      // Store response for success display
      setReportResponse(response)
      setSuccess(true)
      
      // Clear draft from storage on successful submission
      clearDraftFromStorage()
      setHasDraft(false)
      
      // Redirect after success
      setTimeout(() => {
        router.push("/my-alerts")
      }, 3000)
      
    } catch (err) {
      console.error("Failed to submit report:", err)
      
      // Handle different types of errors
      const errorMessage = getErrorMessage(err)
      const fieldErrors = getValidationErrors(err)
      
      setError(errorMessage)
      setValidationErrors(fieldErrors)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-success/50 bg-success/5">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          {isDraft 
            ? "Report saved as draft successfully! You can complete it later by clicking 'Load Draft' below."
            : reportResponse 
              ? `Report submitted successfully! Report ID: ${reportResponse.id}. Status: ${reportResponse.status}. It will be reviewed and published shortly. Thank you for helping keep the community safe.`
              : "Report submitted successfully! It will be reviewed and published shortly. Thank you for helping keep the community safe."
          }
          {!isDraft && (
            <>
              <br />
              Redirecting to your alerts dashboard...
            </>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form className="space-y-6">
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasDraft && (
        <Alert className="border-blue-500/50 bg-blue-50/50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have a saved draft from earlier. Would you like to load it?
            <div className="mt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={loadDraft}
                className="mr-2"
              >
                Load Draft
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  clearDraftFromStorage()
                  setHasDraft(false)
                }}
              >
                Discard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Incident Type */}
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Incident Type *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {incidentTypes.map((type) => (
            <Card
              key={type.value}
              className={`bg-background border-border hover:border-primary/50 cursor-pointer transition-colors ${
                formData.incidentType === type.value ? 'border-primary bg-primary/5' : ''
              } ${
                validationErrors.incidentType ? 'border-destructive' : ''
              }`}
              onClick={() => handleInputChange("incidentType", type.value)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs font-medium text-foreground">{type.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        {validationErrors.incidentType && (
          <p className="text-sm text-destructive">{validationErrors.incidentType}</p>
        )}
      </div>

      {/* Severity Level */}
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Severity Level *</Label>
        <div className="space-y-2">
          {severityLevels.map((level) => (
            <Card
              key={level.value}
              className={`bg-background border-border hover:border-primary/50 cursor-pointer transition-colors ${
                formData.severity === level.value ? 'border-primary bg-primary/5' : ''
              } ${
                validationErrors.severity ? 'border-destructive' : ''
              }`}
              onClick={() => handleInputChange("severity", level.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(level.color)}>{level.label}</Badge>
                    <div>
                      <div className="font-medium text-foreground">{level.label} Priority</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {validationErrors.severity && (
          <p className="text-sm text-destructive">{validationErrors.severity}</p>
        )}
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">Location *</Label>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parish" className="text-foreground">
              Parish *
            </Label>
            <Select value={formData.parish} onValueChange={(value) => handleInputChange("parish", value)}>
              <SelectTrigger className={`bg-background border-border text-foreground ${
                validationErrors.parish ? 'border-destructive' : ''
              }`}>
                <SelectValue placeholder="Select parish" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {parishes.map((parish) => (
                  <SelectItem
                    key={parish}
                    value={parish.toLowerCase()}
                    className="text-foreground hover:bg-muted"
                  >
                    {parish}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.parish && (
              <p className="text-sm text-destructive">{validationErrors.parish}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="community" className="text-foreground">
              Community/Area
            </Label>
            <Input
              id="community"
              value={formData.community}
              onChange={(e) => handleInputChange("community", e.target.value)}
              placeholder="e.g., New Kingston, Half Way Tree"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-foreground">
            Specific Address/Landmark
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Street address, intersection, or nearby landmark"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Incident Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">
          Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe what happened, when it occurred, and any other relevant details..."
          rows={4}
          className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
            validationErrors.description ? 'border-destructive' : ''
          }`}
        />
        {validationErrors.description && (
          <p className="text-sm text-destructive">{validationErrors.description}</p>
        )}
      </div>

      {/* Time Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-foreground">
            Date *
          </Label>
          <Input 
            id="date" 
            type="date" 
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className={`bg-background border-border text-foreground ${
              validationErrors.date ? 'border-destructive' : ''
            }`}
          />
          {validationErrors.date && (
            <p className="text-sm text-destructive">{validationErrors.date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="text-foreground">
            Time (Approximate)
          </Label>
          <Input 
            id="time" 
            type="time" 
            value={formData.time}
            onChange={(e) => handleInputChange("time", e.target.value)}
            className="bg-background border-border text-foreground" 
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">Contact Information (Optional)</Label>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reporterName" className="text-foreground">
              Your Name
            </Label>
            <Input
              id="reporterName"
              value={formData.reporterName}
              onChange={(e) => handleInputChange("reporterName", e.target.value)}
              placeholder="Full name"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              disabled={formData.anonymous}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reporterPhone" className="text-foreground">
              Phone Number
            </Label>
            <Input
              id="reporterPhone"
              type="tel"
              value={formData.reporterPhone}
              onChange={(e) => handleInputChange("reporterPhone", e.target.value)}
              placeholder="+1 (876) 123-4567"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              disabled={formData.anonymous}
            />
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Photos (Optional)</Label>
        <Card className="bg-background border-border border-dashed">
          <CardContent className="p-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground mb-2">
              Upload photos to help illustrate the incident
            </div>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="border-border hover:border-primary bg-transparent"
            >
              Choose Files
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={formData.anonymous}
            onCheckedChange={(checked) => {
              handleInputChange("anonymous", !!checked)
              if (checked) {
                handleInputChange("reporterName", "")
                handleInputChange("reporterPhone", "")
              }
            }}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="anonymous" className="text-sm text-foreground">
            Submit anonymously (your contact information will not be shared)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="updates"
            checked={formData.receiveUpdates}
            onCheckedChange={(checked) => handleInputChange("receiveUpdates", !!checked)}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            disabled={formData.anonymous}
          />
          <Label htmlFor="updates" className="text-sm text-foreground">
            Receive updates about this incident
          </Label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          type="submit"
          onClick={(e) => handleSubmit(e, false)}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading && !isDraft ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting Report...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Submit Report
            </>
          )}
        </Button>
        <Button 
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          variant="outline" 
          size="lg" 
          className="border-border hover:border-primary bg-transparent"
          disabled={isLoading}
        >
          {isLoading && isDraft ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Draft...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </>
          )}
        </Button>
      </div>

      {/* Auto-save indicator */}
      <div className="text-xs text-muted-foreground text-center">
        Your progress is automatically saved every 30 seconds
      </div>
    </form>
  )
}